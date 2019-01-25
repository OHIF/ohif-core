'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var cornerstone = window.cornerstone;
var cornerstoneTools = window.cornerstoneTools;
var cornerstoneWADOImageLoader = window.cornerstoneWADOImageLoader;
var cornerstoneMath = window.cornerstoneMath;
var external = {
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

function getBoundingBox(context, textLines, x, y, options) {
  var cornerstoneTools = external.cornerstoneTools;

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
  var cornerstone = external.cornerstone;
  var enabledElement = cornerstone.getEnabledElement(element);
  var result = {
    x: 0,
    y: 0
  }; // Stop here if the cornerstone element is not enabled or position is not an object

  if (!enabledElement || babelHelpers.typeof(position) !== 'object') {
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
  var cornerstone = external.cornerstone; // Stop here if it's not a measurement creating

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
      return babelHelpers.typeof(tag) === NUMBER && tag >= 0 && tag <= 0xffffffff;
    }
  },
  isValidTag: {
    configurable: false,
    enumerable: true,
    writable: false,
    value: function isValidTag(tag) {
      return babelHelpers.typeof(tag) === STRING ? REGEX_TAG.test(tag) : this.isValidTagNumber(tag);
    }
  },
  find: {
    configurable: false,
    enumerable: true,
    writable: false,
    value: function find(name) {
      var description; // by default, undefined is returned...

      if (babelHelpers.typeof(name) !== STRING) {
        // if it's a number, a tag string will be returned...
        name = this.tagNumberToString(name);
      }

      if (babelHelpers.typeof(name) === STRING) {
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
    var dicomParser = external.dicomParser;
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
    var dicomParser = external.dicomParser;

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

// Commenting this out for now since it looks like Rollup is pulling in the
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
}(commonjsGlobal, (function (exports) {
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
    var str = '';

    for (var i = offset; i < offset + limit; i++) {
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
    var arr = new Uint8Array(str.length);

    for (var i = 0, j = str.length; i < j; i++) {
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
    var parts = header.split('\r\n');

    for (var i = 0; i < parts.length; i++) {
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


  function containsToken(message, token) {
    var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

    if (message + token.length > message.length) {
      return false;
    }

    var index = offset;

    for (var i = 0; i < token.length; i++) {
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


  function findToken(message, token) {
    var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var messageLength = message.length;

    for (var i = offset; i < messageLength; i++) {
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


  function multipartEncode(datasets) {
    var boundary = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : guid();
    var contentType = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'application/dicom';
    var contentTypeString = "Content-Type: ".concat(contentType);
    var header = "\r\n--".concat(boundary, "\r\n").concat(contentTypeString, "\r\n\r\n");
    var footer = "\r\n--".concat(boundary, "--");
    var headerArray = stringToUint8Array(header);
    var footerArray = stringToUint8Array(footer);
    var headerLength = headerArray.length;
    var footerLength = footerArray.length;
    var length = 0; // Calculate the total length for the final array

    var contentArrays = datasets.map(function (datasetBuffer) {
      var contentArray = new Uint8Array(datasetBuffer);
      var contentLength = contentArray.length;
      length += headerLength + contentLength + footerLength;
      return contentArray;
    }); // Allocate the array

    var multipartArray = new Uint8Array(length); // Set the initial header

    multipartArray.set(headerArray, 0); // Write each dataset into the multipart array

    var position = 0;
    contentArrays.forEach(function (contentArray) {
      var contentLength = contentArray.length;
      multipartArray.set(headerArray, position);
      multipartArray.set(contentArray, position + headerLength);
      position += headerLength + contentArray.length;
    });
    multipartArray.set(footerArray, position);
    return {
      data: multipartArray.buffer,
      boundary: boundary
    };
  }
  /**
   * Decode a Multipart encoded ArrayBuffer and return the components as an Array.
   *
   * @param {ArrayBuffer} response Data encoded as a 'multipart/related' message
   * @returns {Array} The content
   */

  function multipartDecode(response) {
    var message = new Uint8Array(response); // First look for the multipart mime header

    var separator = stringToUint8Array('\r\n\r\n');
    var headerIndex = findToken(message, separator);

    if (headerIndex === -1) {
      throw new Error('Response message has no multipart mime header');
    }

    var header = uint8ArrayToString(message, 0, headerIndex);
    var boundaryString = identifyBoundary(header);

    if (!boundaryString) {
      throw new Error('Header of response message does not specify boundary');
    }

    var boundary = stringToUint8Array(boundaryString);
    var boundaryLength = boundary.length;
    var components = [];
    var offset = headerIndex + separator.length; // Loop until we cannot find any more boundaries

    var boundaryIndex;

    while (boundaryIndex !== -1) {
      // Search for the next boundary in the message, starting
      // from the current offset position
      boundaryIndex = findToken(message, boundary, offset); // If no further boundaries are found, stop here.

      if (boundaryIndex === -1) {
        break;
      } // Extract data from response message, excluding "\r\n"


      var spacingLength = 2;
      var length = boundaryIndex - offset - spacingLength;
      var data = response.slice(offset, offset + length); // Add the data to the array of results

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

  var getFirstResult = function getFirstResult(result) {
    return result[0];
  };

  var MIMETYPES = {
    DICOM: 'application/dicom',
    DICOM_JSON: 'application/dicom+json',
    OCTET_STREAM: 'application/octet-stream',
    JPEG: 'image/jpeg',
    PNG: 'image/png'
  };
  /**
  * Class for interacting with DICOMweb RESTful services.
  */

  var DICOMwebClient =
  /*#__PURE__*/
  function () {
    /**
    * @constructor
    * @param {Object} options (choices: "url", "username", "password", "headers")
    */
    function DICOMwebClient(options) {
      _classCallCheck(this, DICOMwebClient);

      this.baseURL = options.url;

      if (!this.baseURL) {
        console.error('no DICOMweb base url provided - calls will fail');
      }

      if ('username' in options) {
        this.username = options.username;

        if (!('password' in options)) {
          console.error('no password provided to authenticate with DICOMweb service');
        }

        this.password = options.password;
      }

      if ('qidoURLPrefix' in options) {
        console.log("use URL prefix for QIDO-RS: ".concat(options.qidoURLPrefix));
        this.qidoURL = this.baseURL + '/' + options.qidoURLPrefix;
      } else {
        this.qidoURL = this.baseURL;
      }

      if ('wadoURLPrefix' in options) {
        console.log("use URL prefix for WADO-RS: ".concat(options.wadoURLPrefix));
        this.wadoURL = this.baseURL + '/' + options.wadoURLPrefix;
      } else {
        this.wadoURL = this.baseURL;
      }

      if ('stowURLPrefix' in options) {
        console.log("use URL prefix for STOW-RS: ".concat(options.stowURLPrefix));
        this.stowURL = this.baseURL + '/' + options.stowURLPrefix;
      } else {
        this.stowURL = this.baseURL;
      }

      this.headers = options.headers || {};
    }

    _createClass(DICOMwebClient, [{
      key: "_httpRequest",
      value: function _httpRequest(url, method, headers) {
        var _this = this;

        var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
        return new Promise(function (resolve, reject) {
          var request = new XMLHttpRequest();
          request.open(method, url, true);

          if ('responseType' in options) {
            request.responseType = options.responseType;
          }

          if (_typeof(headers) === 'object') {
            Object.keys(headers).forEach(function (key) {
              request.setRequestHeader(key, headers[key]);
            });
          } // now add custom headers from the user
          // (e.g. access tokens)


          var userHeaders = _this.headers;
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
                var error = new Error('request failed');
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
    }, {
      key: "_httpGet",
      value: function _httpGet(url, headers, responseType, progressCallback) {
        return this._httpRequest(url, 'get', headers, {
          responseType: responseType,
          progressCallback: progressCallback
        });
      }
    }, {
      key: "_httpGetApplicationJson",
      value: function _httpGetApplicationJson(url) {
        var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var progressCallback = arguments.length > 2 ? arguments[2] : undefined;

        if (_typeof(params) === 'object') {
          if (!isEmptyObject(params)) {
            url += DICOMwebClient._parseQueryParameters(params);
          }
        }

        var headers = {
          'Accept': MIMETYPES.DICOM_JSON
        };
        var responseType = 'json';
        return this._httpGet(url, headers, responseType, progressCallback);
      }
    }, {
      key: "_httpGetByMimeType",
      value: function _httpGetByMimeType(url, mimeType, params) {
        var responseType = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'arraybuffer';
        var progressCallback = arguments.length > 4 ? arguments[4] : undefined;

        if (_typeof(params) === 'object') {
          if (!isEmptyObject(params)) {
            url += DICOMwebClient._parseQueryParameters(params);
          }
        }

        var headers = {
          'Accept': "multipart/related; type=\"".concat(mimeType, "\"")
        };
        return this._httpGet(url, headers, responseType, progressCallback);
      }
    }, {
      key: "_httpPost",
      value: function _httpPost(url, headers, data, progressCallback) {
        return this._httpRequest(url, 'post', headers, {
          data: data,
          progressCallback: progressCallback
        });
      }
    }, {
      key: "_httpPostApplicationJson",
      value: function _httpPostApplicationJson(url, data, progressCallback) {
        var headers = {
          'Content-Type': MIMETYPES.DICOM_JSON
        };
        return this._httpPost(url, headers, data, progressCallback);
      }
      /**
       * Searches for DICOM studies.
       * @param {Object} options options object
       * @return {Array} study representations (http://dicom.nema.org/medical/dicom/current/output/chtml/part18/sect_6.7.html#table_6.7.1-2)
       */

    }, {
      key: "searchForStudies",
      value: function searchForStudies() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        console.log('search for studies');
        var url = this.qidoURL + '/studies';

        if ('queryParams' in options) {
          url += DICOMwebClient._parseQueryParameters(options.queryParams);
        }

        return this._httpGetApplicationJson(url);
      }
      /**
       * Retrieves metadata for a DICOM study.
       * @param {Object} options options object
       * @returns {Array} metadata elements in DICOM JSON format for each instance belonging to the study
       */

    }, {
      key: "retrieveStudyMetadata",
      value: function retrieveStudyMetadata(options) {
        if (!('studyInstanceUID' in options)) {
          throw new Error('Study Instance UID is required for retrieval of study metadata');
        }

        console.log("retrieve metadata of study ".concat(options.studyInstanceUID));
        var url = this.wadoURL + '/studies/' + options.studyInstanceUID + '/metadata';
        return this._httpGetApplicationJson(url);
      }
      /**
       * Searches for DICOM series.
       * @param {Object} options options object
       * @returns {Array} series representations (http://dicom.nema.org/medical/dicom/current/output/chtml/part18/sect_6.7.html#table_6.7.1-2a)
       */

    }, {
      key: "searchForSeries",
      value: function searchForSeries() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var url = this.qidoURL;

        if ('studyInstanceUID' in options) {
          console.log("search series of study ".concat(options.studyInstanceUID));
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
       * @param {Object} options options object
       * @returns {Array} metadata elements in DICOM JSON format for each instance belonging to the series
       */

    }, {
      key: "retrieveSeriesMetadata",
      value: function retrieveSeriesMetadata(options) {
        if (!('studyInstanceUID' in options)) {
          throw new Error('Study Instance UID is required for retrieval of series metadata');
        }

        if (!('seriesInstanceUID' in options)) {
          throw new Error('Series Instance UID is required for retrieval of series metadata');
        }

        console.log("retrieve metadata of series ".concat(options.seriesInstanceUID));
        var url = this.wadoURL + '/studies/' + options.studyInstanceUID + '/series/' + options.seriesInstanceUID + '/metadata';
        return this._httpGetApplicationJson(url);
      }
      /**
       * Searches for DICOM instances.
       * @param {Object} options options object
       * @returns {Array} instance representations (http://dicom.nema.org/medical/dicom/current/output/chtml/part18/sect_6.7.html#table_6.7.1-2b)
       */

    }, {
      key: "searchForInstances",
      value: function searchForInstances() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var url = this.qidoURL;

        if ('studyInstanceUID' in options) {
          url += '/studies/' + options.studyInstanceUID;

          if ('seriesInstanceUID' in options) {
            console.log("search for instances of series ".concat(options.seriesInstanceUID));
            url += '/series/' + options.seriesInstanceUID;
          } else {
            console.log("search for instances of study ".concat(options.studyInstanceUID));
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
       * @param {Object} options options object
       * @returns {String} WADO-URI URL
       */

    }, {
      key: "buildInstanceWadoURIUrl",
      value: function buildInstanceWadoURIUrl(options) {
        if (!('studyInstanceUID' in options)) {
          throw new Error('Study Instance UID is required.');
        }

        if (!('seriesInstanceUID' in options)) {
          throw new Error('Series Instance UID is required.');
        }

        if (!('sopInstanceUID' in options)) {
          throw new Error('SOP Instance UID is required.');
        }

        var contentType = options.contentType || MIMETYPES.DICOM;
        var transferSyntax = options.transferSyntax || '*';
        var params = [];
        params.push('requestType=WADO');
        params.push("studyUID=".concat(options.studyInstanceUID));
        params.push("seriesUID=".concat(options.seriesInstanceUID));
        params.push("objectUID=".concat(options.sopInstanceUID));
        params.push("contentType=".concat(contentType));
        params.push("transferSyntax=".concat(transferSyntax));
        var paramString = params.join('&');
        return "".concat(this.wadoURL, "?").concat(paramString);
      }
      /**
       * Retrieves metadata for a DICOM instance.
       *
       * @param {Object} options object
       * @returns {Object} metadata elements in DICOM JSON format
       */

    }, {
      key: "retrieveInstanceMetadata",
      value: function retrieveInstanceMetadata(options) {
        if (!('studyInstanceUID' in options)) {
          throw new Error('Study Instance UID is required for retrieval of instance metadata');
        }

        if (!('seriesInstanceUID' in options)) {
          throw new Error('Series Instance UID is required for retrieval of instance metadata');
        }

        if (!('sopInstanceUID' in options)) {
          throw new Error('SOP Instance UID is required for retrieval of instance metadata');
        }

        console.log("retrieve metadata of instance ".concat(options.sopInstanceUID));
        var url = this.wadoURL + '/studies/' + options.studyInstanceUID + '/series/' + options.seriesInstanceUID + '/instances/' + options.sopInstanceUID + '/metadata';
        return this._httpGetApplicationJson(url);
      }
      /**
       * Retrieves frames for a DICOM instance.
       * @param {Object} options options object
       * @returns {Array} frame items as byte arrays of the pixel data element
       */

    }, {
      key: "retrieveInstanceFrames",
      value: function retrieveInstanceFrames(options) {
        if (!('studyInstanceUID' in options)) {
          throw new Error('Study Instance UID is required for retrieval of instance frames');
        }

        if (!('seriesInstanceUID' in options)) {
          throw new Error('Series Instance UID is required for retrieval of instance frames');
        }

        if (!('sopInstanceUID' in options)) {
          throw new Error('SOP Instance UID is required for retrieval of instance frames');
        }

        if (!('frameNumbers' in options)) {
          throw new Error('frame numbers are required for retrieval of instance frames');
        }

        console.log("retrieve frames ".concat(options.frameNumbers.toString(), " of instance ").concat(options.sopInstanceUID));
        var url = this.wadoURL + '/studies/' + options.studyInstanceUID + '/series/' + options.seriesInstanceUID + '/instances/' + options.sopInstanceUID + '/frames/' + options.frameNumbers.toString();
        var mimeType = options.mimeType ? "".concat(options.mimeType) : MIMETYPES.OCTET_STREAM;
        return this._httpGetByMimeType(url, mimeType).then(multipartDecode);
      }
      /**
       * Retrieves rendered frames for a DICOM instance.
       * @param {Object} options options object
       * @returns {Array} frame items as byte arrays of the pixel data element
       */

    }, {
      key: "retrieveInstanceFramesRendered",
      value: function retrieveInstanceFramesRendered(options) {
        if (!('studyInstanceUID' in options)) {
          throw new Error('Study Instance UID is required for retrieval of rendered instance frames');
        }

        if (!('seriesInstanceUID' in options)) {
          throw new Error('Series Instance UID is required for retrieval of rendered instance frames');
        }

        if (!('sopInstanceUID' in options)) {
          throw new Error('SOP Instance UID is required for retrieval of rendered instance frames');
        }

        if (!('frameNumbers' in options)) {
          throw new Error('frame numbers are required for retrieval of rendered instance frames');
        }

        console.log("retrieve rendered frames ".concat(options.frameNumbers.toString(), " of instance ").concat(options.sopInstanceUID));
        var url = this.wadoURL + '/studies/' + options.studyInstanceUID + '/series/' + options.seriesInstanceUID + '/instances/' + options.sopInstanceUID + '/frames/' + options.frameNumbers.toString() + '/rendered';
        var headers = {}; // The choice of an acceptable media type depends on a variety of things:
        // http://dicom.nema.org/medical/dicom/current/output/chtml/part18/chapter_6.html#table_6.1.1-3

        if ('mimeType' in options) {
          headers['Accept'] = options.mimeType;
        }

        var responseType = 'arraybuffer';
        return this._httpGet(url, headers, responseType);
      }
      /**
       * Retrieves a DICOM instance.
       * @param {Object} options options object
       * @returns {Arraybuffer} DICOM Part 10 file as Arraybuffer
       */

    }, {
      key: "retrieveInstance",
      value: function retrieveInstance(options) {
        if (!('studyInstanceUID' in options)) {
          throw new Error('Study Instance UID is required');
        }

        if (!('seriesInstanceUID' in options)) {
          throw new Error('Series Instance UID is required');
        }

        if (!('sopInstanceUID' in options)) {
          throw new Error('SOP Instance UID is required');
        }

        var url = this.wadoURL + '/studies/' + options.studyInstanceUID + '/series/' + options.seriesInstanceUID + '/instances/' + options.sopInstanceUID;
        return this._httpGetByMimeType(url, MIMETYPES.DICOM).then(multipartDecode).then(getFirstResult);
      }
      /**
       * Retrieves a set of DICOM instance for a series.
       * @param {Object} options options object
       * @returns {Arraybuffer[]} Array of DICOM Part 10 files as Arraybuffers
       */

    }, {
      key: "retrieveSeries",
      value: function retrieveSeries(options) {
        if (!('studyInstanceUID' in options)) {
          throw new Error('Study Instance UID is required');
        }

        if (!('seriesInstanceUID' in options)) {
          throw new Error('Series Instance UID is required');
        }

        var url = this.wadoURL + '/studies/' + options.studyInstanceUID + '/series/' + options.seriesInstanceUID;
        return this._httpGetByMimeType(url, MIMETYPES.DICOM).then(multipartDecode);
      }
      /**
       * Retrieves a set of DICOM instance for a study.
       * @param {Object} options options object
       * @returns {Arraybuffer[]} Array of DICOM Part 10 files as Arraybuffers
       */

    }, {
      key: "retrieveStudy",
      value: function retrieveStudy(options) {
        if (!('studyInstanceUID' in options)) {
          throw new Error('Study Instance UID is required');
        }

        var url = this.wadoURL + '/studies/' + options.studyInstanceUID;
        return this._httpGetByMimeType(url, MIMETYPES.DICOM).then(multipartDecode);
      }
      /**
       * Retrieves and parses BulkData from a BulkDataURI location.
       * Decodes the multipart encoded data and returns the resulting data
       * as an ArrayBuffer.
       *
       * See http://dicom.nema.org/medical/dicom/current/output/chtml/part18/sect_6.5.5.html
       *
       * @param {Object} options options object
       * @return {Promise}
       */

    }, {
      key: "retrieveBulkData",
      value: function retrieveBulkData(options) {
        if (!('BulkDataURI' in options)) {
          throw new Error('BulkDataURI is required.');
        }

        return this._httpGetByMimeType(options.BulkDataURI, MIMETYPES.OCTET_STREAM).then(multipartDecode).then(getFirstResult);
      }
      /**
       * Stores DICOM instances.
       *
       * @param {Object} options options object
       */

    }, {
      key: "storeInstances",
      value: function storeInstances(options) {
        if (!('datasets' in options)) {
          throw new Error('datasets are required for storing');
        }

        var url = "".concat(this.stowURL, "/studies");

        if ('studyInstanceUID' in options) {
          url += "/".concat(options.studyInstanceUID);
        }

        var _multipartEncode = multipartEncode(options.datasets),
            data = _multipartEncode.data,
            boundary = _multipartEncode.boundary;

        var headers = {
          'Content-Type': "multipart/related; type=application/dicom; boundary=".concat(boundary)
        };
        return this._httpPost(url, headers, data, options.progressCallback);
      }
    }], [{
      key: "_parseQueryParameters",
      value: function _parseQueryParameters() {
        var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var queryString = '?';
        Object.keys(params).forEach(function (key, index) {
          if (index !== 0) {
            queryString += '&';
          }

          queryString += key + '=' + encodeURIComponent(params[key]);
        });
        return queryString;
      }
    }]);

    return DICOMwebClient;
  }();

  function findSubstring(str, before, after) {
    var beforeIndex = str.lastIndexOf(before) + before.length;

    if (beforeIndex < before.length) {
      return null;
    }

    if (after !== undefined) {
      var afterIndex = str.lastIndexOf(after);

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
      uid = findSubstring(uri, "studies/");
    }

    if (!uid) {
      console.debug('Study Instance UID could not be dertermined from URI "' + uri + '"');
    }

    return uid;
  }

  function getSeriesInstanceUIDFromUri(uri) {
    var uid = findSubstring(uri, "series/", "/instances");

    if (!uid) {
      uid = findSubstring(uri, "series/");
    }

    if (!uid) {
      console.debug('Series Instance UID could not be dertermined from URI "' + uri + '"');
    }

    return uid;
  }

  function getSOPInstanceUIDFromUri(uri) {
    var uid = findSubstring(uri, "/instances/", "/frames");

    if (!uid) {
      uid = findSubstring(uri, "/instances/", "/metadata");
    }

    if (!uid) {
      uid = findSubstring(uri, "/instances/");
    }

    if (!uid) {
      console.debug('SOP Instance UID could not be dertermined from URI"' + uri + '"');
    }

    return uid;
  }

  function getFrameNumbersFromUri(uri) {
    var numbers = findSubstring(uri, "/frames/", "/rendered");

    if (!numbers) {
      numbers = findSubstring(uri, "/frames/");
    }

    if (numbers === undefined) {
      console.debug('Frames Numbers could not be dertermined from URI"' + uri + '"');
    }

    return numbers.split(',');
  }

  var version = '0.3.2';

  var api = {
    DICOMwebClient: DICOMwebClient
  };
  var utils = {
    getStudyInstanceUIDFromUri: getStudyInstanceUIDFromUri,
    getSeriesInstanceUIDFromUri: getSeriesInstanceUIDFromUri,
    getSOPInstanceUIDFromUri: getSOPInstanceUIDFromUri,
    getFrameNumbersFromUri: getFrameNumbersFromUri
  };

  exports.api = api;
  exports.utils = utils;
  exports.version = version;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=dicomweb-client.js.map
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

var runtime = createCommonjsModule(function (module) {
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

!(function(global) {

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = module.exports;

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] =
    GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  runtime.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  runtime.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return Promise.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  runtime.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return runtime.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        if (delegate.iterator.return) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[toStringTagSymbol] = "Generator";

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };
})(
  // In sloppy mode, unbound `this` refers to the global object, fallback to
  // Function constructor if we're in global strict mode. That is sadly a form
  // of indirect eval which violates Content Security Policy.
  (function() {
    return this || (typeof self === "object" && self);
  })() || Function("return this")()
);
});

/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This method of obtaining a reference to the global object needs to be
// kept identical to the way it is obtained in runtime.js
var g = (function() {
  return this || (typeof self === "object" && self);
})() || Function("return this")();

// Use `getOwnPropertyNames` because not all browsers support calling
// `hasOwnProperty` on the global `self` object in a worker. See #183.
var hadRuntime = g.regeneratorRuntime &&
  Object.getOwnPropertyNames(g).indexOf("regeneratorRuntime") >= 0;

// Save the old regeneratorRuntime in case it needs to be restored later.
var oldRuntime = hadRuntime && g.regeneratorRuntime;

// Force reevalutation of runtime.js.
g.regeneratorRuntime = undefined;

var runtimeModule = runtime;

if (hadRuntime) {
  // Restore the original runtime.
  g.regeneratorRuntime = oldRuntime;
} else {
  // Remove the global property added by runtime.js.
  try {
    delete g.regeneratorRuntime;
  } catch(e) {
    g.regeneratorRuntime = undefined;
  }
}

var regenerator = runtimeModule;

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
  _getPaletteColors = babelHelpers.asyncToGenerator(
  /*#__PURE__*/
  regenerator.mark(function _callee(server, instance, lutDescriptor) {
    var paletteUID;
    return regenerator.wrap(function _callee$(_context) {
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
  _resultDataToStudyMetadata = babelHelpers.asyncToGenerator(
  /*#__PURE__*/
  regenerator.mark(function _callee3(server, studyInstanceUid, resultData) {
    var _studyData;

    var anInstance, studyData, seriesMap;
    return regenerator.wrap(function _callee3$(_context3) {
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
            // TODO: Pass a reference ID to the server instead of including the URLs here
            studyData = (_studyData = {
              seriesList: [],
              studyInstanceUid: studyInstanceUid,
              wadoUriRoot: server.wadoUriRoot,
              wadoRoot: server.wadoRoot,
              qidoRoot: server.qidoRoot,
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
            }, babelHelpers.defineProperty(_studyData, "studyInstanceUid", DICOMWeb.getString(anInstance['0020000D'])), babelHelpers.defineProperty(_studyData, "institutionName", DICOMWeb.getString(anInstance['00080080'])), _studyData);
            seriesMap = {};
            _context3.next = 9;
            return Promise.all(resultData.map(
            /*#__PURE__*/
            function () {
              var _ref = babelHelpers.asyncToGenerator(
              /*#__PURE__*/
              regenerator.mark(function _callee2(instance) {
                var seriesInstanceUid, series, sopInstanceUid, wadouri, baseWadoRsUri, wadorsuri, instanceSummary, redPaletteColorLookupTableDescriptor, greenPaletteColorLookupTableDescriptor, bluePaletteColorLookupTableDescriptor, palettes;
                return regenerator.wrap(function _callee2$(_context2) {
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
  _RetrieveMetadata = babelHelpers.asyncToGenerator(
  /*#__PURE__*/
  regenerator.mark(function _callee4(server, studyInstanceUid) {
    var config, dicomWeb, options;
    return regenerator.wrap(function _callee4$(_context4) {
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
    babelHelpers.classCallCheck(this, Metadata);
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

  babelHelpers.createClass(Metadata, [{
    key: "getData",
    value: function getData() {
      return this._data;
    }
  }, {
    key: "getDataProperty",
    value: function getDataProperty(propertyName) {
      var propertyValue;
      var _data = this._data;

      if (_data instanceof Object || babelHelpers.typeof(_data) === OBJECT && _data !== null) {
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
      return babelHelpers.typeof(uid) === STRING$1 && uid.length > 0;
    }
  }, {
    key: "isValidIndex",
    value: function isValidIndex(index) {
      return babelHelpers.typeof(index) === NUMBER$1 && index >= 0 && (index | 0) === index;
    }
  }, {
    key: "isValidCallback",
    value: function isValidCallback(callback) {
      return babelHelpers.typeof(callback) === FUNCTION;
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
  babelHelpers.inherits(OHIFError, _Error);

  function OHIFError(message) {
    var _this;

    babelHelpers.classCallCheck(this, OHIFError);
    _this = babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(OHIFError).call(this));
    _this.message = message;
    _this.stack = new Error().stack;
    _this.name = _this.constructor.name;
    return _this;
  }

  return OHIFError;
}(babelHelpers.wrapNativeSuper(Error));

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
  babelHelpers.inherits(InstanceMetadata, _Metadata);

  function InstanceMetadata(data, uid) {
    var _this;

    babelHelpers.classCallCheck(this, InstanceMetadata);
    _this = babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(InstanceMetadata).call(this, data, uid)); // Initialize Private Properties

    Object.defineProperties(babelHelpers.assertThisInitialized(babelHelpers.assertThisInitialized(_this)), {
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


  babelHelpers.createClass(InstanceMetadata, [{
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

      if (babelHelpers.typeof(value) !== STRING$2 && babelHelpers.typeof(value) !== UNDEFINED) {
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

      return babelHelpers.typeof(value) === STRING$2 ? parseFloat(value) : value;
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

      return babelHelpers.typeof(value) === STRING$2 ? parseInt(value) : value;
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

      if (babelHelpers.typeof(value) === STRING$2) {
        var hasIndexValues = value.indexOf('\\') !== -1;
        result = value;

        if (hasIndexValues) {
          var splitValues = value.split('\\');

          if (Metadata.isValidIndex(index)) {
            var indexedValue = splitValues[index];
            result = babelHelpers.typeof(indexedValue) !== STRING$2 ? defaultValue : indexedValue;
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
  babelHelpers.inherits(SeriesMetadata, _Metadata);

  function SeriesMetadata(data, uid) {
    var _this;

    babelHelpers.classCallCheck(this, SeriesMetadata);
    _this = babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(SeriesMetadata).call(this, data, uid)); // Initialize Private Properties

    Object.defineProperties(babelHelpers.assertThisInitialized(babelHelpers.assertThisInitialized(_this)), {
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


  babelHelpers.createClass(SeriesMetadata, [{
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
    babelHelpers.classCallCheck(this, ImageSet);

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

  babelHelpers.createClass(ImageSet, [{
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
      if (babelHelpers.typeof(attributes) === OBJECT$1 && attributes !== null) {
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
  babelHelpers.inherits(StudyMetadata, _Metadata);

  function StudyMetadata(data, uid) {
    var _this;

    babelHelpers.classCallCheck(this, StudyMetadata);
    _this = babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(StudyMetadata).call(this, data, uid)); // Initialize Private Properties

    Object.defineProperties(babelHelpers.assertThisInitialized(babelHelpers.assertThisInitialized(_this)), {
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


  babelHelpers.createClass(StudyMetadata, [{
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
     * two arguments: display set (an ImageSet instance) and index (the integer
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
    babelHelpers.classCallCheck(this, WadoRsMetaDataBuilder);
    this.tags = {};
  }

  babelHelpers.createClass(WadoRsMetaDataBuilder, [{
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
    var promise = Studies(server, filter);
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
    babelHelpers.classCallCheck(this, CommandsManager);
    this.contexts = {};
  }

  babelHelpers.createClass(CommandsManager, [{
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
      var contextName = window.store.getState().commandContext.context;

      if (!contextName) {
        log$1.warn('There is no selected context');
        return null;
      }

      return this.getContext(contextName);
    }
  }, {
    key: "createContext",
    value: function createContext(contextName) {
      if (!contextName) {
        return;
      }

      if (this.contexts[contextName]) {
        return this.clear(contextName);
      }

      this.contexts[contextName] = {};
    }
  }, {
    key: "set",
    value: function set(contextName, definitions) {
      var extend = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      if (babelHelpers.typeof(definitions) !== 'object') {
        return;
      }

      var context = this.getContext(contextName);

      if (!context) {
        return;
      }

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
      if (babelHelpers.typeof(definition) !== 'object') {
        return;
      }

      var context = this.getContext(contextName);

      if (!context) {
        return;
      }

      context[command] = definition;
    }
  }, {
    key: "setDisabledFunction",
    value: function setDisabledFunction(contextName, command, func) {
      if (!command || !isFunction(func)) {
        return;
      }

      var context = this.getContext(contextName);

      if (!context) {
        return;
      }

      var definition = context[command];

      if (!definition) {
        log$1.warn("Trying to set a disabled function to a command \"".concat(command, "\" that was not yet defined"));
        return;
      }

      definition.disabled = func;
    }
  }, {
    key: "clear",
    value: function clear(contextName) {
      if (!contextName) {
        return;
      }

      this.contexts[contextName] = {};
    }
  }, {
    key: "getDefinition",
    value: function getDefinition(command) {
      var context = this.getCurrentContext();

      if (!context) {
        return;
      }

      return context[command];
    }
  }, {
    key: "isDisabled",
    value: function isDisabled(command) {
      var definition = this.getDefinition(command);

      if (!definition) {
        return false;
      }

      var disabled = definition.disabled;

      if (isFunction(disabled) && disabled()) {
        return true;
      }

      if (!isFunction(disabled) && disabled) {
        return true;
      }

      return false;
    }
  }, {
    key: "run",
    value: function run(command) {
      var definition = this.getDefinition(command);

      if (!definition) {
        return log$1.warn("Command \"".concat(command, "\" not found in current context"));
      }

      if (this.isDisabled(command)) {
        return;
      }

      var action = definition.action,
          params = definition.params;

      if (!isFunction(action)) {
        log$1.warn("No action was defined for command \"".concat(command, "\""));
        return;
      } else {
        return action(params);
      }
    }
  }]);
  return CommandsManager;
}();

var commands = new CommandsManager(); // Export relevant objects

var jquery = createCommonjsModule(function (module) {
/*!
 * jQuery JavaScript Library v3.3.1
 * https://jquery.com/
 *
 * Includes Sizzle.js
 * https://sizzlejs.com/
 *
 * Copyright JS Foundation and other contributors
 * Released under the MIT license
 * https://jquery.org/license
 *
 * Date: 2018-01-20T17:24Z
 */
( function( global, factory ) {

	{

		// For CommonJS and CommonJS-like environments where a proper `window`
		// is present, execute the factory and get jQuery.
		// For environments that do not have a `window` with a `document`
		// (such as Node.js), expose a factory as module.exports.
		// This accentuates the need for the creation of a real `window`.
		// e.g. var jQuery = require("jquery")(window);
		// See ticket #14549 for more info.
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document ) {
					throw new Error( "jQuery requires a window with a document" );
				}
				return factory( w );
			};
	}

// Pass this if window is not defined yet
} )( typeof window !== "undefined" ? window : commonjsGlobal, function( window, noGlobal ) {

var arr = [];

var document = window.document;

var getProto = Object.getPrototypeOf;

var slice = arr.slice;

var concat = arr.concat;

var push = arr.push;

var indexOf = arr.indexOf;

var class2type = {};

var toString = class2type.toString;

var hasOwn = class2type.hasOwnProperty;

var fnToString = hasOwn.toString;

var ObjectFunctionString = fnToString.call( Object );

var support = {};

var isFunction = function isFunction( obj ) {

      // Support: Chrome <=57, Firefox <=52
      // In some browsers, typeof returns "function" for HTML <object> elements
      // (i.e., `typeof document.createElement( "object" ) === "function"`).
      // We don't want to classify *any* DOM node as a function.
      return typeof obj === "function" && typeof obj.nodeType !== "number";
  };


var isWindow = function isWindow( obj ) {
		return obj != null && obj === obj.window;
	};




	var preservedScriptAttributes = {
		type: true,
		src: true,
		noModule: true
	};

	function DOMEval( code, doc, node ) {
		doc = doc || document;

		var i,
			script = doc.createElement( "script" );

		script.text = code;
		if ( node ) {
			for ( i in preservedScriptAttributes ) {
				if ( node[ i ] ) {
					script[ i ] = node[ i ];
				}
			}
		}
		doc.head.appendChild( script ).parentNode.removeChild( script );
	}


function toType( obj ) {
	if ( obj == null ) {
		return obj + "";
	}

	// Support: Android <=2.3 only (functionish RegExp)
	return typeof obj === "object" || typeof obj === "function" ?
		class2type[ toString.call( obj ) ] || "object" :
		typeof obj;
}
/* global Symbol */
// Defining this global in .eslintrc.json would create a danger of using the global
// unguarded in another place, it seems safer to define global only for this module



var
	version = "3.3.1",

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {

		// The jQuery object is actually just the init constructor 'enhanced'
		// Need init if jQuery is called (just allow error to be thrown if not included)
		return new jQuery.fn.init( selector, context );
	},

	// Support: Android <=4.0 only
	// Make sure we trim BOM and NBSP
	rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;

jQuery.fn = jQuery.prototype = {

	// The current version of jQuery being used
	jquery: version,

	constructor: jQuery,

	// The default length of a jQuery object is 0
	length: 0,

	toArray: function() {
		return slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {

		// Return all the elements in a clean array
		if ( num == null ) {
			return slice.call( this );
		}

		// Return just the one element from the set
		return num < 0 ? this[ num + this.length ] : this[ num ];
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	each: function( callback ) {
		return jQuery.each( this, callback );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map( this, function( elem, i ) {
			return callback.call( elem, i, elem );
		} ) );
	},

	slice: function() {
		return this.pushStack( slice.apply( this, arguments ) );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	eq: function( i ) {
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[ j ] ] : [] );
	},

	end: function() {
		return this.prevObject || this.constructor();
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: push,
	sort: arr.sort,
	splice: arr.splice
};

jQuery.extend = jQuery.fn.extend = function() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[ 0 ] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;

		// Skip the boolean and the target
		target = arguments[ i ] || {};
		i++;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !isFunction( target ) ) {
		target = {};
	}

	// Extend jQuery itself if only one argument is passed
	if ( i === length ) {
		target = this;
		i--;
	}

	for ( ; i < length; i++ ) {

		// Only deal with non-null/undefined values
		if ( ( options = arguments[ i ] ) != null ) {

			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject( copy ) ||
					( copyIsArray = Array.isArray( copy ) ) ) ) {

					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && Array.isArray( src ) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject( src ) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend( {

	// Unique for each copy of jQuery on the page
	expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

	// Assume jQuery is ready without the ready module
	isReady: true,

	error: function( msg ) {
		throw new Error( msg );
	},

	noop: function() {},

	isPlainObject: function( obj ) {
		var proto, Ctor;

		// Detect obvious negatives
		// Use toString instead of jQuery.type to catch host objects
		if ( !obj || toString.call( obj ) !== "[object Object]" ) {
			return false;
		}

		proto = getProto( obj );

		// Objects with no prototype (e.g., `Object.create( null )`) are plain
		if ( !proto ) {
			return true;
		}

		// Objects with prototype are plain iff they were constructed by a global Object function
		Ctor = hasOwn.call( proto, "constructor" ) && proto.constructor;
		return typeof Ctor === "function" && fnToString.call( Ctor ) === ObjectFunctionString;
	},

	isEmptyObject: function( obj ) {

		/* eslint-disable no-unused-vars */
		// See https://github.com/eslint/eslint/issues/6125
		var name;

		for ( name in obj ) {
			return false;
		}
		return true;
	},

	// Evaluates a script in a global context
	globalEval: function( code ) {
		DOMEval( code );
	},

	each: function( obj, callback ) {
		var length, i = 0;

		if ( isArrayLike( obj ) ) {
			length = obj.length;
			for ( ; i < length; i++ ) {
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
					break;
				}
			}
		} else {
			for ( i in obj ) {
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
					break;
				}
			}
		}

		return obj;
	},

	// Support: Android <=4.0 only
	trim: function( text ) {
		return text == null ?
			"" :
			( text + "" ).replace( rtrim, "" );
	},

	// results is for internal usage only
	makeArray: function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArrayLike( Object( arr ) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				push.call( ret, arr );
			}
		}

		return ret;
	},

	inArray: function( elem, arr, i ) {
		return arr == null ? -1 : indexOf.call( arr, elem, i );
	},

	// Support: Android <=4.0 only, PhantomJS 1 only
	// push.apply(_, arraylike) throws on ancient WebKit
	merge: function( first, second ) {
		var len = +second.length,
			j = 0,
			i = first.length;

		for ( ; j < len; j++ ) {
			first[ i++ ] = second[ j ];
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, invert ) {
		var callbackInverse,
			matches = [],
			i = 0,
			length = elems.length,
			callbackExpect = !invert;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			callbackInverse = !callback( elems[ i ], i );
			if ( callbackInverse !== callbackExpect ) {
				matches.push( elems[ i ] );
			}
		}

		return matches;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var length, value,
			i = 0,
			ret = [];

		// Go through the array, translating each of the items to their new values
		if ( isArrayLike( elems ) ) {
			length = elems.length;
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}

		// Go through every key on the object,
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}
		}

		// Flatten any nested arrays
		return concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// jQuery.support is not used in Core but other projects attach their
	// properties to it so it needs to exist.
	support: support
} );

if ( typeof Symbol === "function" ) {
	jQuery.fn[ Symbol.iterator ] = arr[ Symbol.iterator ];
}

// Populate the class2type map
jQuery.each( "Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " ),
function( i, name ) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
} );

function isArrayLike( obj ) {

	// Support: real iOS 8.2 only (not reproducible in simulator)
	// `in` check used to prevent JIT error (gh-2145)
	// hasOwn isn't used here due to false negatives
	// regarding Nodelist length in IE
	var length = !!obj && "length" in obj && obj.length,
		type = toType( obj );

	if ( isFunction( obj ) || isWindow( obj ) ) {
		return false;
	}

	return type === "array" || length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj;
}
var Sizzle =
/*!
 * Sizzle CSS Selector Engine v2.3.3
 * https://sizzlejs.com/
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2016-08-08
 */
(function( window ) {

var i,
	support,
	Expr,
	getText,
	isXML,
	tokenize,
	compile,
	select,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + 1 * new Date(),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf as it's faster than native
	// https://jsperf.com/thor-indexof-vs-for/5
	indexOf = function( list, elem ) {
		var i = 0,
			len = list.length;
		for ( ; i < len; i++ ) {
			if ( list[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",

	// http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",

	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
		// Operator (capture 2)
		"*([*^$|!~]?=)" + whitespace +
		// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
		"*\\]",

	pseudos = ":(" + identifier + ")(?:\\((" +
		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
		// 1. quoted (capture 3; capture 4 or capture 5)
		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
		// 2. simple (capture 6)
		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
		// 3. anything else (capture 2)
		".*" +
		")\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rwhitespace = new RegExp( whitespace + "+", "g" ),
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + identifier + ")" ),
		"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
		"TAG": new RegExp( "^(" + identifier + "|[*])" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,

	// CSS escapes
	// http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox<24
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			high < 0 ?
				// BMP codepoint
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	},

	// CSS string/identifier serialization
	// https://drafts.csswg.org/cssom/#common-serializing-idioms
	rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
	fcssescape = function( ch, asCodePoint ) {
		if ( asCodePoint ) {

			// U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
			if ( ch === "\0" ) {
				return "\uFFFD";
			}

			// Control characters and (dependent upon position) numbers get escaped as code points
			return ch.slice( 0, -1 ) + "\\" + ch.charCodeAt( ch.length - 1 ).toString( 16 ) + " ";
		}

		// Other potentially-special ASCII characters get backslash-escaped
		return "\\" + ch;
	},

	// Used for iframes
	// See setDocument()
	// Removing the function wrapper causes a "Permission Denied"
	// error in IE
	unloadHandler = function() {
		setDocument();
	},

	disabledAncestor = addCombinator(
		function( elem ) {
			return elem.disabled === true && ("form" in elem || "label" in elem);
		},
		{ dir: "parentNode", next: "legend" }
	);

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var m, i, elem, nid, match, groups, newSelector,
		newContext = context && context.ownerDocument,

		// nodeType defaults to 9, since context defaults to document
		nodeType = context ? context.nodeType : 9;

	results = results || [];

	// Return early from calls with invalid selector or context
	if ( typeof selector !== "string" || !selector ||
		nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

		return results;
	}

	// Try to shortcut find operations (as opposed to filters) in HTML documents
	if ( !seed ) {

		if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
			setDocument( context );
		}
		context = context || document;

		if ( documentIsHTML ) {

			// If the selector is sufficiently simple, try using a "get*By*" DOM method
			// (excepting DocumentFragment context, where the methods don't exist)
			if ( nodeType !== 11 && (match = rquickExpr.exec( selector )) ) {

				// ID selector
				if ( (m = match[1]) ) {

					// Document context
					if ( nodeType === 9 ) {
						if ( (elem = context.getElementById( m )) ) {

							// Support: IE, Opera, Webkit
							// TODO: identify versions
							// getElementById can match elements by name instead of ID
							if ( elem.id === m ) {
								results.push( elem );
								return results;
							}
						} else {
							return results;
						}

					// Element context
					} else {

						// Support: IE, Opera, Webkit
						// TODO: identify versions
						// getElementById can match elements by name instead of ID
						if ( newContext && (elem = newContext.getElementById( m )) &&
							contains( context, elem ) &&
							elem.id === m ) {

							results.push( elem );
							return results;
						}
					}

				// Type selector
				} else if ( match[2] ) {
					push.apply( results, context.getElementsByTagName( selector ) );
					return results;

				// Class selector
				} else if ( (m = match[3]) && support.getElementsByClassName &&
					context.getElementsByClassName ) {

					push.apply( results, context.getElementsByClassName( m ) );
					return results;
				}
			}

			// Take advantage of querySelectorAll
			if ( support.qsa &&
				!compilerCache[ selector + " " ] &&
				(!rbuggyQSA || !rbuggyQSA.test( selector )) ) {

				if ( nodeType !== 1 ) {
					newContext = context;
					newSelector = selector;

				// qSA looks outside Element context, which is not what we want
				// Thanks to Andrew Dupont for this workaround technique
				// Support: IE <=8
				// Exclude object elements
				} else if ( context.nodeName.toLowerCase() !== "object" ) {

					// Capture the context ID, setting it first if necessary
					if ( (nid = context.getAttribute( "id" )) ) {
						nid = nid.replace( rcssescape, fcssescape );
					} else {
						context.setAttribute( "id", (nid = expando) );
					}

					// Prefix every selector in the list
					groups = tokenize( selector );
					i = groups.length;
					while ( i-- ) {
						groups[i] = "#" + nid + " " + toSelector( groups[i] );
					}
					newSelector = groups.join( "," );

					// Expand context for sibling selectors
					newContext = rsibling.test( selector ) && testContext( context.parentNode ) ||
						context;
				}

				if ( newSelector ) {
					try {
						push.apply( results,
							newContext.querySelectorAll( newSelector )
						);
						return results;
					} catch ( qsaError ) {
					} finally {
						if ( nid === expando ) {
							context.removeAttribute( "id" );
						}
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {function(string, object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key + " " ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created element and returns a boolean result
 */
function assert( fn ) {
	var el = document.createElement("fieldset");

	try {
		return !!fn( el );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( el.parentNode ) {
			el.parentNode.removeChild( el );
		}
		// release memory in IE
		el = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = arr.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			a.sourceIndex - b.sourceIndex;

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for :enabled/:disabled
 * @param {Boolean} disabled true for :disabled; false for :enabled
 */
function createDisabledPseudo( disabled ) {

	// Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
	return function( elem ) {

		// Only certain elements can match :enabled or :disabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
		if ( "form" in elem ) {

			// Check for inherited disabledness on relevant non-disabled elements:
			// * listed form-associated elements in a disabled fieldset
			//   https://html.spec.whatwg.org/multipage/forms.html#category-listed
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
			// * option elements in a disabled optgroup
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
			// All such elements have a "form" property.
			if ( elem.parentNode && elem.disabled === false ) {

				// Option elements defer to a parent optgroup if present
				if ( "label" in elem ) {
					if ( "label" in elem.parentNode ) {
						return elem.parentNode.disabled === disabled;
					} else {
						return elem.disabled === disabled;
					}
				}

				// Support: IE 6 - 11
				// Use the isDisabled shortcut property to check for disabled fieldset ancestors
				return elem.isDisabled === disabled ||

					// Where there is no isDisabled, check manually
					/* jshint -W018 */
					elem.isDisabled !== !disabled &&
						disabledAncestor( elem ) === disabled;
			}

			return elem.disabled === disabled;

		// Try to winnow out elements that can't be disabled before trusting the disabled property.
		// Some victims get caught in our net (label, legend, menu, track), but it shouldn't
		// even exist on them, let alone have a boolean value.
		} else if ( "label" in elem ) {
			return elem.disabled === disabled;
		}

		// Remaining elements are neither :enabled nor :disabled
		return false;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== "undefined" && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare, subWindow,
		doc = node ? node.ownerDocument || node : preferredDoc;

	// Return early if doc is invalid or already selected
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Update global variables
	document = doc;
	docElem = document.documentElement;
	documentIsHTML = !isXML( document );

	// Support: IE 9-11, Edge
	// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
	if ( preferredDoc !== document &&
		(subWindow = document.defaultView) && subWindow.top !== subWindow ) {

		// Support: IE 11, Edge
		if ( subWindow.addEventListener ) {
			subWindow.addEventListener( "unload", unloadHandler, false );

		// Support: IE 9 - 10 only
		} else if ( subWindow.attachEvent ) {
			subWindow.attachEvent( "onunload", unloadHandler );
		}
	}

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties
	// (excepting IE8 booleans)
	support.attributes = assert(function( el ) {
		el.className = "i";
		return !el.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( el ) {
		el.appendChild( document.createComment("") );
		return !el.getElementsByTagName("*").length;
	});

	// Support: IE<9
	support.getElementsByClassName = rnative.test( document.getElementsByClassName );

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programmatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( el ) {
		docElem.appendChild( el ).id = expando;
		return !document.getElementsByName || !document.getElementsByName( expando ).length;
	});

	// ID filter and find
	if ( support.getById ) {
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var elem = context.getElementById( id );
				return elem ? [ elem ] : [];
			}
		};
	} else {
		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== "undefined" &&
					elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};

		// Support: IE 6 - 7 only
		// getElementById is not reliable as a find shortcut
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var node, i, elems,
					elem = context.getElementById( id );

				if ( elem ) {

					// Verify the id attribute
					node = elem.getAttributeNode("id");
					if ( node && node.value === id ) {
						return [ elem ];
					}

					// Fall back on getElementsByName
					elems = context.getElementsByName( id );
					i = 0;
					while ( (elem = elems[i++]) ) {
						node = elem.getAttributeNode("id");
						if ( node && node.value === id ) {
							return [ elem ];
						}
					}
				}

				return [];
			}
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== "undefined" ) {
				return context.getElementsByTagName( tag );

			// DocumentFragment nodes don't have gEBTN
			} else if ( support.qsa ) {
				return context.querySelectorAll( tag );
			}
		} :

		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See https://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( document.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( el ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// https://bugs.jquery.com/ticket/12359
			docElem.appendChild( el ).innerHTML = "<a id='" + expando + "'></a>" +
				"<select id='" + expando + "-\r\\' msallowcapture=''>" +
				"<option selected=''></option></select>";

			// Support: IE8, Opera 11-12.16
			// Nothing should be selected when empty strings follow ^= or $= or *=
			// The test attribute must be unknown in Opera but "safe" for WinRT
			// https://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
			if ( el.querySelectorAll("[msallowcapture^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !el.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
			if ( !el.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
				rbuggyQSA.push("~=");
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !el.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}

			// Support: Safari 8+, iOS 8+
			// https://bugs.webkit.org/show_bug.cgi?id=136851
			// In-page `selector#id sibling-combinator selector` fails
			if ( !el.querySelectorAll( "a#" + expando + "+*" ).length ) {
				rbuggyQSA.push(".#.+[+~]");
			}
		});

		assert(function( el ) {
			el.innerHTML = "<a href='' disabled='disabled'></a>" +
				"<select disabled='disabled'><option/></select>";

			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = document.createElement("input");
			input.setAttribute( "type", "hidden" );
			el.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( el.querySelectorAll("[name=d]").length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( el.querySelectorAll(":enabled").length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Support: IE9-11+
			// IE's :disabled selector does not pick up the children of disabled fieldsets
			docElem.appendChild( el ).disabled = true;
			if ( el.querySelectorAll(":disabled").length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			el.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( el ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( el, "*" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( el, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully self-exclusive
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			// Choose the first element that is related to our preferred document
			if ( a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			return a === document ? -1 :
				b === document ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return document;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		!compilerCache[ expr + " " ] &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch (e) {}
	}

	return Sizzle( expr, document, null, [ elem ] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null;
};

Sizzle.escape = function( sel ) {
	return (sel + "").replace( rcssescape, fcssescape );
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[6] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] ) {
				match[2] = match[4] || match[5] || "";

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, uniqueCache, outerCache, node, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType,
						diff = false;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) {

										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {

							// Seek `elem` from a previously-cached index

							// ...in a gzip-friendly way
							node = parent;
							outerCache = node[ expando ] || (node[ expando ] = {});

							// Support: IE <9 only
							// Defend against cloned attroperties (jQuery gh-1709)
							uniqueCache = outerCache[ node.uniqueID ] ||
								(outerCache[ node.uniqueID ] = {});

							cache = uniqueCache[ type ] || [];
							nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
							diff = nodeIndex && cache[ 2 ];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									uniqueCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						} else {
							// Use previously-cached element index if available
							if ( useCache ) {
								// ...in a gzip-friendly way
								node = elem;
								outerCache = node[ expando ] || (node[ expando ] = {});

								// Support: IE <9 only
								// Defend against cloned attroperties (jQuery gh-1709)
								uniqueCache = outerCache[ node.uniqueID ] ||
									(outerCache[ node.uniqueID ] = {});

								cache = uniqueCache[ type ] || [];
								nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
								diff = nodeIndex;
							}

							// xml :nth-child(...)
							// or :nth-last-child(...) or :nth(-last)?-of-type(...)
							if ( diff === false ) {
								// Use the same loop as above to seek `elem` from the start
								while ( (node = ++nodeIndex && node && node[ dir ] ||
									(diff = nodeIndex = 0) || start.pop()) ) {

									if ( ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) &&
										++diff ) {

										// Cache the index of each encountered element
										if ( useCache ) {
											outerCache = node[ expando ] || (node[ expando ] = {});

											// Support: IE <9 only
											// Defend against cloned attroperties (jQuery gh-1709)
											uniqueCache = outerCache[ node.uniqueID ] ||
												(outerCache[ node.uniqueID ] = {});

											uniqueCache[ type ] = [ dirruns, diff ];
										}

										if ( node === elem ) {
											break;
										}
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					// Don't keep the element (issue #299)
					input[0] = null;
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			text = text.replace( runescape, funescape );
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": createDisabledPseudo( false ),
		"disabled": createDisabledPseudo( true ),

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( (tokens = []) );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
};

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		skip = combinator.next,
		key = skip || dir,
		checkNonElements = base && key === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
			return false;
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, uniqueCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});

						// Support: IE <9 only
						// Defend against cloned attroperties (jQuery gh-1709)
						uniqueCache = outerCache[ elem.uniqueID ] || (outerCache[ elem.uniqueID ] = {});

						if ( skip && skip === elem.nodeName.toLowerCase() ) {
							elem = elem[ dir ] || elem;
						} else if ( (oldCache = uniqueCache[ key ]) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
						} else {
							// Reuse newcache so results back-propagate to previous elements
							uniqueCache[ key ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								return true;
							}
						}
					}
				}
			}
			return false;
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
			// Avoid hanging onto element (issue #299)
			checkContext = null;
			return ret;
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context === document || context || outermost;
			}

			// Add elements passing elementMatchers directly to results
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					if ( !context && elem.ownerDocument !== document ) {
						setDocument( elem );
						xml = !documentIsHTML;
					}
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context || document, xml) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// `i` is now the count of elements visited above, and adding it to `matchedCount`
			// makes the latter nonnegative.
			matchedCount += i;

			// Apply set filters to unmatched elements
			// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
			// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
			// no element matchers and no seed.
			// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
			// case, which will result in a "00" `matchedCount` that differs from `i` but is also
			// numerically zero.
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {
			match = tokenize( selector );
		}
		i = match.length;
		while ( i-- ) {
			cached = matcherFromTokens( match[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

		// Save selector and tokenization
		cached.selector = selector;
	}
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.select = function( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize( (selector = compiled.selector || selector) );

	results = results || [];

	// Try to minimize operations if there is only one selector in the list and no seed
	// (the latter of which guarantees us context)
	if ( match.length === 1 ) {

		// Reduce context if the leading compound selector is an ID
		tokens = match[0] = match[0].slice( 0 );
		if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
				context.nodeType === 9 && documentIsHTML && Expr.relative[ tokens[1].type ] ) {

			context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
			if ( !context ) {
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
		}

		// Fetch a seed set for right-to-left matching
		i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
		while ( i-- ) {
			token = tokens[i];

			// Abort if we hit a combinator
			if ( Expr.relative[ (type = token.type) ] ) {
				break;
			}
			if ( (find = Expr.find[ type ]) ) {
				// Search, expanding context for leading sibling combinators
				if ( (seed = find(
					token.matches[0].replace( runescape, funescape ),
					rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
				)) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					selector = seed.length && toSelector( tokens );
					if ( !selector ) {
						push.apply( results, seed );
						return results;
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		context,
		!documentIsHTML,
		results,
		!context || rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( el ) {
	// Should return 1, but returns 4 (following)
	return el.compareDocumentPosition( document.createElement("fieldset") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// https://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( el ) {
	el.innerHTML = "<a href='#'></a>";
	return el.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( el ) {
	el.innerHTML = "<input/>";
	el.firstChild.setAttribute( "value", "" );
	return el.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( el ) {
	return el.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}

return Sizzle;

})( window );



jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;

// Deprecated
jQuery.expr[ ":" ] = jQuery.expr.pseudos;
jQuery.uniqueSort = jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;
jQuery.escapeSelector = Sizzle.escape;




var dir = function( elem, dir, until ) {
	var matched = [],
		truncate = until !== undefined;

	while ( ( elem = elem[ dir ] ) && elem.nodeType !== 9 ) {
		if ( elem.nodeType === 1 ) {
			if ( truncate && jQuery( elem ).is( until ) ) {
				break;
			}
			matched.push( elem );
		}
	}
	return matched;
};


var siblings = function( n, elem ) {
	var matched = [];

	for ( ; n; n = n.nextSibling ) {
		if ( n.nodeType === 1 && n !== elem ) {
			matched.push( n );
		}
	}

	return matched;
};


var rneedsContext = jQuery.expr.match.needsContext;



function nodeName( elem, name ) {

  return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();

}var rsingleTag = ( /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i );



// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {
	if ( isFunction( qualifier ) ) {
		return jQuery.grep( elements, function( elem, i ) {
			return !!qualifier.call( elem, i, elem ) !== not;
		} );
	}

	// Single element
	if ( qualifier.nodeType ) {
		return jQuery.grep( elements, function( elem ) {
			return ( elem === qualifier ) !== not;
		} );
	}

	// Arraylike of elements (jQuery, arguments, Array)
	if ( typeof qualifier !== "string" ) {
		return jQuery.grep( elements, function( elem ) {
			return ( indexOf.call( qualifier, elem ) > -1 ) !== not;
		} );
	}

	// Filtered directly for both simple and complex selectors
	return jQuery.filter( qualifier, elements, not );
}

jQuery.filter = function( expr, elems, not ) {
	var elem = elems[ 0 ];

	if ( not ) {
		expr = ":not(" + expr + ")";
	}

	if ( elems.length === 1 && elem.nodeType === 1 ) {
		return jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [];
	}

	return jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
		return elem.nodeType === 1;
	} ) );
};

jQuery.fn.extend( {
	find: function( selector ) {
		var i, ret,
			len = this.length,
			self = this;

		if ( typeof selector !== "string" ) {
			return this.pushStack( jQuery( selector ).filter( function() {
				for ( i = 0; i < len; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			} ) );
		}

		ret = this.pushStack( [] );

		for ( i = 0; i < len; i++ ) {
			jQuery.find( selector, self[ i ], ret );
		}

		return len > 1 ? jQuery.uniqueSort( ret ) : ret;
	},
	filter: function( selector ) {
		return this.pushStack( winnow( this, selector || [], false ) );
	},
	not: function( selector ) {
		return this.pushStack( winnow( this, selector || [], true ) );
	},
	is: function( selector ) {
		return !!winnow(
			this,

			// If this is a positional/relative selector, check membership in the returned set
			// so $("p:first").is("p:last") won't return true for a doc with two "p".
			typeof selector === "string" && rneedsContext.test( selector ) ?
				jQuery( selector ) :
				selector || [],
			false
		).length;
	}
} );


// Initialize a jQuery object


// A central reference to the root jQuery(document)
var rootjQuery,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)
	// Shortcut simple #id case for speed
	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,

	init = jQuery.fn.init = function( selector, context, root ) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// Method init() accepts an alternate rootjQuery
		// so migrate can support jQuery.sub (gh-2101)
		root = root || rootjQuery;

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			if ( selector[ 0 ] === "<" &&
				selector[ selector.length - 1 ] === ">" &&
				selector.length >= 3 ) {

				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && ( match[ 1 ] || !context ) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[ 1 ] ) {
					context = context instanceof jQuery ? context[ 0 ] : context;

					// Option to run scripts is true for back-compat
					// Intentionally let the error be thrown if parseHTML is not present
					jQuery.merge( this, jQuery.parseHTML(
						match[ 1 ],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					// HANDLE: $(html, props)
					if ( rsingleTag.test( match[ 1 ] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {

							// Properties of context are called as methods if possible
							if ( isFunction( this[ match ] ) ) {
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
				} else {
					elem = document.getElementById( match[ 2 ] );

					if ( elem ) {

						// Inject the element directly into the jQuery object
						this[ 0 ] = elem;
						this.length = 1;
					}
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || root ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
		} else if ( selector.nodeType ) {
			this[ 0 ] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( isFunction( selector ) ) {
			return root.ready !== undefined ?
				root.ready( selector ) :

				// Execute immediately if ready is not present
				selector( jQuery );
		}

		return jQuery.makeArray( selector, this );
	};

// Give the init function the jQuery prototype for later instantiation
init.prototype = jQuery.fn;

// Initialize central reference
rootjQuery = jQuery( document );


var rparentsprev = /^(?:parents|prev(?:Until|All))/,

	// Methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.fn.extend( {
	has: function( target ) {
		var targets = jQuery( target, this ),
			l = targets.length;

		return this.filter( function() {
			var i = 0;
			for ( ; i < l; i++ ) {
				if ( jQuery.contains( this, targets[ i ] ) ) {
					return true;
				}
			}
		} );
	},

	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			matched = [],
			targets = typeof selectors !== "string" && jQuery( selectors );

		// Positional selectors never match, since there's no _selection_ context
		if ( !rneedsContext.test( selectors ) ) {
			for ( ; i < l; i++ ) {
				for ( cur = this[ i ]; cur && cur !== context; cur = cur.parentNode ) {

					// Always skip document fragments
					if ( cur.nodeType < 11 && ( targets ?
						targets.index( cur ) > -1 :

						// Don't pass non-elements to Sizzle
						cur.nodeType === 1 &&
							jQuery.find.matchesSelector( cur, selectors ) ) ) {

						matched.push( cur );
						break;
					}
				}
			}
		}

		return this.pushStack( matched.length > 1 ? jQuery.uniqueSort( matched ) : matched );
	},

	// Determine the position of an element within the set
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
		}

		// Index in selector
		if ( typeof elem === "string" ) {
			return indexOf.call( jQuery( elem ), this[ 0 ] );
		}

		// Locate the position of the desired element
		return indexOf.call( this,

			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[ 0 ] : elem
		);
	},

	add: function( selector, context ) {
		return this.pushStack(
			jQuery.uniqueSort(
				jQuery.merge( this.get(), jQuery( selector, context ) )
			)
		);
	},

	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter( selector )
		);
	}
} );

function sibling( cur, dir ) {
	while ( ( cur = cur[ dir ] ) && cur.nodeType !== 1 ) {}
	return cur;
}

jQuery.each( {
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	nextAll: function( elem ) {
		return dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return siblings( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function( elem ) {
		return siblings( elem.firstChild );
	},
	contents: function( elem ) {
        if ( nodeName( elem, "iframe" ) ) {
            return elem.contentDocument;
        }

        // Support: IE 9 - 11 only, iOS 7 only, Android Browser <=4.3 only
        // Treat the template element as a regular one in browsers that
        // don't support it.
        if ( nodeName( elem, "template" ) ) {
            elem = elem.content || elem;
        }

        return jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var matched = jQuery.map( this, fn, until );

		if ( name.slice( -5 ) !== "Until" ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			matched = jQuery.filter( selector, matched );
		}

		if ( this.length > 1 ) {

			// Remove duplicates
			if ( !guaranteedUnique[ name ] ) {
				jQuery.uniqueSort( matched );
			}

			// Reverse order for parents* and prev-derivatives
			if ( rparentsprev.test( name ) ) {
				matched.reverse();
			}
		}

		return this.pushStack( matched );
	};
} );
var rnothtmlwhite = ( /[^\x20\t\r\n\f]+/g );



// Convert String-formatted options into Object-formatted ones
function createOptions( options ) {
	var object = {};
	jQuery.each( options.match( rnothtmlwhite ) || [], function( _, flag ) {
		object[ flag ] = true;
	} );
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		createOptions( options ) :
		jQuery.extend( {}, options );

	var // Flag to know if list is currently firing
		firing,

		// Last fire value for non-forgettable lists
		memory,

		// Flag to know if list was already fired
		fired,

		// Flag to prevent firing
		locked,

		// Actual callback list
		list = [],

		// Queue of execution data for repeatable lists
		queue = [],

		// Index of currently firing callback (modified by add/remove as needed)
		firingIndex = -1,

		// Fire callbacks
		fire = function() {

			// Enforce single-firing
			locked = locked || options.once;

			// Execute callbacks for all pending executions,
			// respecting firingIndex overrides and runtime changes
			fired = firing = true;
			for ( ; queue.length; firingIndex = -1 ) {
				memory = queue.shift();
				while ( ++firingIndex < list.length ) {

					// Run callback and check for early termination
					if ( list[ firingIndex ].apply( memory[ 0 ], memory[ 1 ] ) === false &&
						options.stopOnFalse ) {

						// Jump to end and forget the data so .add doesn't re-fire
						firingIndex = list.length;
						memory = false;
					}
				}
			}

			// Forget the data if we're done with it
			if ( !options.memory ) {
				memory = false;
			}

			firing = false;

			// Clean up if we're done firing for good
			if ( locked ) {

				// Keep an empty list if we have data for future add calls
				if ( memory ) {
					list = [];

				// Otherwise, this object is spent
				} else {
					list = "";
				}
			}
		},

		// Actual Callbacks object
		self = {

			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {

					// If we have memory from a past run, we should fire after adding
					if ( memory && !firing ) {
						firingIndex = list.length - 1;
						queue.push( memory );
					}

					( function add( args ) {
						jQuery.each( args, function( _, arg ) {
							if ( isFunction( arg ) ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && toType( arg ) !== "string" ) {

								// Inspect recursively
								add( arg );
							}
						} );
					} )( arguments );

					if ( memory && !firing ) {
						fire();
					}
				}
				return this;
			},

			// Remove a callback from the list
			remove: function() {
				jQuery.each( arguments, function( _, arg ) {
					var index;
					while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
						list.splice( index, 1 );

						// Handle firing indexes
						if ( index <= firingIndex ) {
							firingIndex--;
						}
					}
				} );
				return this;
			},

			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
			has: function( fn ) {
				return fn ?
					jQuery.inArray( fn, list ) > -1 :
					list.length > 0;
			},

			// Remove all callbacks from the list
			empty: function() {
				if ( list ) {
					list = [];
				}
				return this;
			},

			// Disable .fire and .add
			// Abort any current/pending executions
			// Clear all callbacks and values
			disable: function() {
				locked = queue = [];
				list = memory = "";
				return this;
			},
			disabled: function() {
				return !list;
			},

			// Disable .fire
			// Also disable .add unless we have memory (since it would have no effect)
			// Abort any pending executions
			lock: function() {
				locked = queue = [];
				if ( !memory && !firing ) {
					list = memory = "";
				}
				return this;
			},
			locked: function() {
				return !!locked;
			},

			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				if ( !locked ) {
					args = args || [];
					args = [ context, args.slice ? args.slice() : args ];
					queue.push( args );
					if ( !firing ) {
						fire();
					}
				}
				return this;
			},

			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},

			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!fired;
			}
		};

	return self;
};


function Identity( v ) {
	return v;
}
function Thrower( ex ) {
	throw ex;
}

function adoptValue( value, resolve, reject, noValue ) {
	var method;

	try {

		// Check for promise aspect first to privilege synchronous behavior
		if ( value && isFunction( ( method = value.promise ) ) ) {
			method.call( value ).done( resolve ).fail( reject );

		// Other thenables
		} else if ( value && isFunction( ( method = value.then ) ) ) {
			method.call( value, resolve, reject );

		// Other non-thenables
		} else {

			// Control `resolve` arguments by letting Array#slice cast boolean `noValue` to integer:
			// * false: [ value ].slice( 0 ) => resolve( value )
			// * true: [ value ].slice( 1 ) => resolve()
			resolve.apply( undefined, [ value ].slice( noValue ) );
		}

	// For Promises/A+, convert exceptions into rejections
	// Since jQuery.when doesn't unwrap thenables, we can skip the extra checks appearing in
	// Deferred#then to conditionally suppress rejection.
	} catch ( value ) {

		// Support: Android 4.0 only
		// Strict mode functions invoked without .call/.apply get global-object context
		reject.apply( undefined, [ value ] );
	}
}

jQuery.extend( {

	Deferred: function( func ) {
		var tuples = [

				// action, add listener, callbacks,
				// ... .then handlers, argument index, [final state]
				[ "notify", "progress", jQuery.Callbacks( "memory" ),
					jQuery.Callbacks( "memory" ), 2 ],
				[ "resolve", "done", jQuery.Callbacks( "once memory" ),
					jQuery.Callbacks( "once memory" ), 0, "resolved" ],
				[ "reject", "fail", jQuery.Callbacks( "once memory" ),
					jQuery.Callbacks( "once memory" ), 1, "rejected" ]
			],
			state = "pending",
			promise = {
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				"catch": function( fn ) {
					return promise.then( null, fn );
				},

				// Keep pipe for back-compat
				pipe: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;

					return jQuery.Deferred( function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {

							// Map tuples (progress, done, fail) to arguments (done, fail, progress)
							var fn = isFunction( fns[ tuple[ 4 ] ] ) && fns[ tuple[ 4 ] ];

							// deferred.progress(function() { bind to newDefer or newDefer.notify })
							// deferred.done(function() { bind to newDefer or newDefer.resolve })
							// deferred.fail(function() { bind to newDefer or newDefer.reject })
							deferred[ tuple[ 1 ] ]( function() {
								var returned = fn && fn.apply( this, arguments );
								if ( returned && isFunction( returned.promise ) ) {
									returned.promise()
										.progress( newDefer.notify )
										.done( newDefer.resolve )
										.fail( newDefer.reject );
								} else {
									newDefer[ tuple[ 0 ] + "With" ](
										this,
										fn ? [ returned ] : arguments
									);
								}
							} );
						} );
						fns = null;
					} ).promise();
				},
				then: function( onFulfilled, onRejected, onProgress ) {
					var maxDepth = 0;
					function resolve( depth, deferred, handler, special ) {
						return function() {
							var that = this,
								args = arguments,
								mightThrow = function() {
									var returned, then;

									// Support: Promises/A+ section 2.3.3.3.3
									// https://promisesaplus.com/#point-59
									// Ignore double-resolution attempts
									if ( depth < maxDepth ) {
										return;
									}

									returned = handler.apply( that, args );

									// Support: Promises/A+ section 2.3.1
									// https://promisesaplus.com/#point-48
									if ( returned === deferred.promise() ) {
										throw new TypeError( "Thenable self-resolution" );
									}

									// Support: Promises/A+ sections 2.3.3.1, 3.5
									// https://promisesaplus.com/#point-54
									// https://promisesaplus.com/#point-75
									// Retrieve `then` only once
									then = returned &&

										// Support: Promises/A+ section 2.3.4
										// https://promisesaplus.com/#point-64
										// Only check objects and functions for thenability
										( typeof returned === "object" ||
											typeof returned === "function" ) &&
										returned.then;

									// Handle a returned thenable
									if ( isFunction( then ) ) {

										// Special processors (notify) just wait for resolution
										if ( special ) {
											then.call(
												returned,
												resolve( maxDepth, deferred, Identity, special ),
												resolve( maxDepth, deferred, Thrower, special )
											);

										// Normal processors (resolve) also hook into progress
										} else {

											// ...and disregard older resolution values
											maxDepth++;

											then.call(
												returned,
												resolve( maxDepth, deferred, Identity, special ),
												resolve( maxDepth, deferred, Thrower, special ),
												resolve( maxDepth, deferred, Identity,
													deferred.notifyWith )
											);
										}

									// Handle all other returned values
									} else {

										// Only substitute handlers pass on context
										// and multiple values (non-spec behavior)
										if ( handler !== Identity ) {
											that = undefined;
											args = [ returned ];
										}

										// Process the value(s)
										// Default process is resolve
										( special || deferred.resolveWith )( that, args );
									}
								},

								// Only normal processors (resolve) catch and reject exceptions
								process = special ?
									mightThrow :
									function() {
										try {
											mightThrow();
										} catch ( e ) {

											if ( jQuery.Deferred.exceptionHook ) {
												jQuery.Deferred.exceptionHook( e,
													process.stackTrace );
											}

											// Support: Promises/A+ section 2.3.3.3.4.1
											// https://promisesaplus.com/#point-61
											// Ignore post-resolution exceptions
											if ( depth + 1 >= maxDepth ) {

												// Only substitute handlers pass on context
												// and multiple values (non-spec behavior)
												if ( handler !== Thrower ) {
													that = undefined;
													args = [ e ];
												}

												deferred.rejectWith( that, args );
											}
										}
									};

							// Support: Promises/A+ section 2.3.3.3.1
							// https://promisesaplus.com/#point-57
							// Re-resolve promises immediately to dodge false rejection from
							// subsequent errors
							if ( depth ) {
								process();
							} else {

								// Call an optional hook to record the stack, in case of exception
								// since it's otherwise lost when execution goes async
								if ( jQuery.Deferred.getStackHook ) {
									process.stackTrace = jQuery.Deferred.getStackHook();
								}
								window.setTimeout( process );
							}
						};
					}

					return jQuery.Deferred( function( newDefer ) {

						// progress_handlers.add( ... )
						tuples[ 0 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								isFunction( onProgress ) ?
									onProgress :
									Identity,
								newDefer.notifyWith
							)
						);

						// fulfilled_handlers.add( ... )
						tuples[ 1 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								isFunction( onFulfilled ) ?
									onFulfilled :
									Identity
							)
						);

						// rejected_handlers.add( ... )
						tuples[ 2 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								isFunction( onRejected ) ?
									onRejected :
									Thrower
							)
						);
					} ).promise();
				},

				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ],
				stateString = tuple[ 5 ];

			// promise.progress = list.add
			// promise.done = list.add
			// promise.fail = list.add
			promise[ tuple[ 1 ] ] = list.add;

			// Handle state
			if ( stateString ) {
				list.add(
					function() {

						// state = "resolved" (i.e., fulfilled)
						// state = "rejected"
						state = stateString;
					},

					// rejected_callbacks.disable
					// fulfilled_callbacks.disable
					tuples[ 3 - i ][ 2 ].disable,

					// rejected_handlers.disable
					// fulfilled_handlers.disable
					tuples[ 3 - i ][ 3 ].disable,

					// progress_callbacks.lock
					tuples[ 0 ][ 2 ].lock,

					// progress_handlers.lock
					tuples[ 0 ][ 3 ].lock
				);
			}

			// progress_handlers.fire
			// fulfilled_handlers.fire
			// rejected_handlers.fire
			list.add( tuple[ 3 ].fire );

			// deferred.notify = function() { deferred.notifyWith(...) }
			// deferred.resolve = function() { deferred.resolveWith(...) }
			// deferred.reject = function() { deferred.rejectWith(...) }
			deferred[ tuple[ 0 ] ] = function() {
				deferred[ tuple[ 0 ] + "With" ]( this === deferred ? undefined : this, arguments );
				return this;
			};

			// deferred.notifyWith = list.fireWith
			// deferred.resolveWith = list.fireWith
			// deferred.rejectWith = list.fireWith
			deferred[ tuple[ 0 ] + "With" ] = list.fireWith;
		} );

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( singleValue ) {
		var

			// count of uncompleted subordinates
			remaining = arguments.length,

			// count of unprocessed arguments
			i = remaining,

			// subordinate fulfillment data
			resolveContexts = Array( i ),
			resolveValues = slice.call( arguments ),

			// the master Deferred
			master = jQuery.Deferred(),

			// subordinate callback factory
			updateFunc = function( i ) {
				return function( value ) {
					resolveContexts[ i ] = this;
					resolveValues[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
					if ( !( --remaining ) ) {
						master.resolveWith( resolveContexts, resolveValues );
					}
				};
			};

		// Single- and empty arguments are adopted like Promise.resolve
		if ( remaining <= 1 ) {
			adoptValue( singleValue, master.done( updateFunc( i ) ).resolve, master.reject,
				!remaining );

			// Use .then() to unwrap secondary thenables (cf. gh-3000)
			if ( master.state() === "pending" ||
				isFunction( resolveValues[ i ] && resolveValues[ i ].then ) ) {

				return master.then();
			}
		}

		// Multiple arguments are aggregated like Promise.all array elements
		while ( i-- ) {
			adoptValue( resolveValues[ i ], updateFunc( i ), master.reject );
		}

		return master.promise();
	}
} );


// These usually indicate a programmer mistake during development,
// warn about them ASAP rather than swallowing them by default.
var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;

jQuery.Deferred.exceptionHook = function( error, stack ) {

	// Support: IE 8 - 9 only
	// Console exists when dev tools are open, which can happen at any time
	if ( window.console && window.console.warn && error && rerrorNames.test( error.name ) ) {
		window.console.warn( "jQuery.Deferred exception: " + error.message, error.stack, stack );
	}
};




jQuery.readyException = function( error ) {
	window.setTimeout( function() {
		throw error;
	} );
};




// The deferred used on DOM ready
var readyList = jQuery.Deferred();

jQuery.fn.ready = function( fn ) {

	readyList
		.then( fn )

		// Wrap jQuery.readyException in a function so that the lookup
		// happens at the time of error handling instead of callback
		// registration.
		.catch( function( error ) {
			jQuery.readyException( error );
		} );

	return this;
};

jQuery.extend( {

	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Handle when the DOM is ready
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );
	}
} );

jQuery.ready.then = readyList.then;

// The ready event handler and self cleanup method
function completed() {
	document.removeEventListener( "DOMContentLoaded", completed );
	window.removeEventListener( "load", completed );
	jQuery.ready();
}

// Catch cases where $(document).ready() is called
// after the browser event has already occurred.
// Support: IE <=9 - 10 only
// Older IE sometimes signals "interactive" too soon
if ( document.readyState === "complete" ||
	( document.readyState !== "loading" && !document.documentElement.doScroll ) ) {

	// Handle it asynchronously to allow scripts the opportunity to delay ready
	window.setTimeout( jQuery.ready );

} else {

	// Use the handy event callback
	document.addEventListener( "DOMContentLoaded", completed );

	// A fallback to window.onload, that will always work
	window.addEventListener( "load", completed );
}




// Multifunctional method to get and set values of a collection
// The value/s can optionally be executed if it's a function
var access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
	var i = 0,
		len = elems.length,
		bulk = key == null;

	// Sets many values
	if ( toType( key ) === "object" ) {
		chainable = true;
		for ( i in key ) {
			access( elems, fn, i, key[ i ], true, emptyGet, raw );
		}

	// Sets one value
	} else if ( value !== undefined ) {
		chainable = true;

		if ( !isFunction( value ) ) {
			raw = true;
		}

		if ( bulk ) {

			// Bulk operations run against the entire set
			if ( raw ) {
				fn.call( elems, value );
				fn = null;

			// ...except when executing function values
			} else {
				bulk = fn;
				fn = function( elem, key, value ) {
					return bulk.call( jQuery( elem ), value );
				};
			}
		}

		if ( fn ) {
			for ( ; i < len; i++ ) {
				fn(
					elems[ i ], key, raw ?
					value :
					value.call( elems[ i ], i, fn( elems[ i ], key ) )
				);
			}
		}
	}

	if ( chainable ) {
		return elems;
	}

	// Gets
	if ( bulk ) {
		return fn.call( elems );
	}

	return len ? fn( elems[ 0 ], key ) : emptyGet;
};


// Matches dashed string for camelizing
var rmsPrefix = /^-ms-/,
	rdashAlpha = /-([a-z])/g;

// Used by camelCase as callback to replace()
function fcamelCase( all, letter ) {
	return letter.toUpperCase();
}

// Convert dashed to camelCase; used by the css and data modules
// Support: IE <=9 - 11, Edge 12 - 15
// Microsoft forgot to hump their vendor prefix (#9572)
function camelCase( string ) {
	return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
}
var acceptData = function( owner ) {

	// Accepts only:
	//  - Node
	//    - Node.ELEMENT_NODE
	//    - Node.DOCUMENT_NODE
	//  - Object
	//    - Any
	return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
};




function Data() {
	this.expando = jQuery.expando + Data.uid++;
}

Data.uid = 1;

Data.prototype = {

	cache: function( owner ) {

		// Check if the owner object already has a cache
		var value = owner[ this.expando ];

		// If not, create one
		if ( !value ) {
			value = {};

			// We can accept data for non-element nodes in modern browsers,
			// but we should not, see #8335.
			// Always return an empty object.
			if ( acceptData( owner ) ) {

				// If it is a node unlikely to be stringify-ed or looped over
				// use plain assignment
				if ( owner.nodeType ) {
					owner[ this.expando ] = value;

				// Otherwise secure it in a non-enumerable property
				// configurable must be true to allow the property to be
				// deleted when data is removed
				} else {
					Object.defineProperty( owner, this.expando, {
						value: value,
						configurable: true
					} );
				}
			}
		}

		return value;
	},
	set: function( owner, data, value ) {
		var prop,
			cache = this.cache( owner );

		// Handle: [ owner, key, value ] args
		// Always use camelCase key (gh-2257)
		if ( typeof data === "string" ) {
			cache[ camelCase( data ) ] = value;

		// Handle: [ owner, { properties } ] args
		} else {

			// Copy the properties one-by-one to the cache object
			for ( prop in data ) {
				cache[ camelCase( prop ) ] = data[ prop ];
			}
		}
		return cache;
	},
	get: function( owner, key ) {
		return key === undefined ?
			this.cache( owner ) :

			// Always use camelCase key (gh-2257)
			owner[ this.expando ] && owner[ this.expando ][ camelCase( key ) ];
	},
	access: function( owner, key, value ) {

		// In cases where either:
		//
		//   1. No key was specified
		//   2. A string key was specified, but no value provided
		//
		// Take the "read" path and allow the get method to determine
		// which value to return, respectively either:
		//
		//   1. The entire cache object
		//   2. The data stored at the key
		//
		if ( key === undefined ||
				( ( key && typeof key === "string" ) && value === undefined ) ) {

			return this.get( owner, key );
		}

		// When the key is not a string, or both a key and value
		// are specified, set or extend (existing objects) with either:
		//
		//   1. An object of properties
		//   2. A key and value
		//
		this.set( owner, key, value );

		// Since the "set" path can have two possible entry points
		// return the expected data based on which path was taken[*]
		return value !== undefined ? value : key;
	},
	remove: function( owner, key ) {
		var i,
			cache = owner[ this.expando ];

		if ( cache === undefined ) {
			return;
		}

		if ( key !== undefined ) {

			// Support array or space separated string of keys
			if ( Array.isArray( key ) ) {

				// If key is an array of keys...
				// We always set camelCase keys, so remove that.
				key = key.map( camelCase );
			} else {
				key = camelCase( key );

				// If a key with the spaces exists, use it.
				// Otherwise, create an array by matching non-whitespace
				key = key in cache ?
					[ key ] :
					( key.match( rnothtmlwhite ) || [] );
			}

			i = key.length;

			while ( i-- ) {
				delete cache[ key[ i ] ];
			}
		}

		// Remove the expando if there's no more data
		if ( key === undefined || jQuery.isEmptyObject( cache ) ) {

			// Support: Chrome <=35 - 45
			// Webkit & Blink performance suffers when deleting properties
			// from DOM nodes, so set to undefined instead
			// https://bugs.chromium.org/p/chromium/issues/detail?id=378607 (bug restricted)
			if ( owner.nodeType ) {
				owner[ this.expando ] = undefined;
			} else {
				delete owner[ this.expando ];
			}
		}
	},
	hasData: function( owner ) {
		var cache = owner[ this.expando ];
		return cache !== undefined && !jQuery.isEmptyObject( cache );
	}
};
var dataPriv = new Data();

var dataUser = new Data();



//	Implementation Summary
//
//	1. Enforce API surface and semantic compatibility with 1.9.x branch
//	2. Improve the module's maintainability by reducing the storage
//		paths to a single mechanism.
//	3. Use the same single mechanism to support "private" and "user" data.
//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
//	5. Avoid exposing implementation details on user objects (eg. expando properties)
//	6. Provide a clear path for implementation upgrade to WeakMap in 2014

var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
	rmultiDash = /[A-Z]/g;

function getData( data ) {
	if ( data === "true" ) {
		return true;
	}

	if ( data === "false" ) {
		return false;
	}

	if ( data === "null" ) {
		return null;
	}

	// Only convert to a number if it doesn't change the string
	if ( data === +data + "" ) {
		return +data;
	}

	if ( rbrace.test( data ) ) {
		return JSON.parse( data );
	}

	return data;
}

function dataAttr( elem, key, data ) {
	var name;

	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {
		name = "data-" + key.replace( rmultiDash, "-$&" ).toLowerCase();
		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = getData( data );
			} catch ( e ) {}

			// Make sure we set the data so it isn't changed later
			dataUser.set( elem, key, data );
		} else {
			data = undefined;
		}
	}
	return data;
}

jQuery.extend( {
	hasData: function( elem ) {
		return dataUser.hasData( elem ) || dataPriv.hasData( elem );
	},

	data: function( elem, name, data ) {
		return dataUser.access( elem, name, data );
	},

	removeData: function( elem, name ) {
		dataUser.remove( elem, name );
	},

	// TODO: Now that all calls to _data and _removeData have been replaced
	// with direct calls to dataPriv methods, these can be deprecated.
	_data: function( elem, name, data ) {
		return dataPriv.access( elem, name, data );
	},

	_removeData: function( elem, name ) {
		dataPriv.remove( elem, name );
	}
} );

jQuery.fn.extend( {
	data: function( key, value ) {
		var i, name, data,
			elem = this[ 0 ],
			attrs = elem && elem.attributes;

		// Gets all values
		if ( key === undefined ) {
			if ( this.length ) {
				data = dataUser.get( elem );

				if ( elem.nodeType === 1 && !dataPriv.get( elem, "hasDataAttrs" ) ) {
					i = attrs.length;
					while ( i-- ) {

						// Support: IE 11 only
						// The attrs elements can be null (#14894)
						if ( attrs[ i ] ) {
							name = attrs[ i ].name;
							if ( name.indexOf( "data-" ) === 0 ) {
								name = camelCase( name.slice( 5 ) );
								dataAttr( elem, name, data[ name ] );
							}
						}
					}
					dataPriv.set( elem, "hasDataAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {
			return this.each( function() {
				dataUser.set( this, key );
			} );
		}

		return access( this, function( value ) {
			var data;

			// The calling jQuery object (element matches) is not empty
			// (and therefore has an element appears at this[ 0 ]) and the
			// `value` parameter was not undefined. An empty jQuery object
			// will result in `undefined` for elem = this[ 0 ] which will
			// throw an exception if an attempt to read a data cache is made.
			if ( elem && value === undefined ) {

				// Attempt to get data from the cache
				// The key will always be camelCased in Data
				data = dataUser.get( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				// Attempt to "discover" the data in
				// HTML5 custom data-* attrs
				data = dataAttr( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				// We tried really hard, but the data doesn't exist.
				return;
			}

			// Set the data...
			this.each( function() {

				// We always store the camelCased key
				dataUser.set( this, key, value );
			} );
		}, null, value, arguments.length > 1, null, true );
	},

	removeData: function( key ) {
		return this.each( function() {
			dataUser.remove( this, key );
		} );
	}
} );


jQuery.extend( {
	queue: function( elem, type, data ) {
		var queue;

		if ( elem ) {
			type = ( type || "fx" ) + "queue";
			queue = dataPriv.get( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !queue || Array.isArray( data ) ) {
					queue = dataPriv.access( elem, type, jQuery.makeArray( data ) );
				} else {
					queue.push( data );
				}
			}
			return queue || [];
		}
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			// Clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
		}

		if ( !startLength && hooks ) {
			hooks.empty.fire();
		}
	},

	// Not public - generate a queueHooks object, or return the current one
	_queueHooks: function( elem, type ) {
		var key = type + "queueHooks";
		return dataPriv.get( elem, key ) || dataPriv.access( elem, key, {
			empty: jQuery.Callbacks( "once memory" ).add( function() {
				dataPriv.remove( elem, [ type + "queue", key ] );
			} )
		} );
	}
} );

jQuery.fn.extend( {
	queue: function( type, data ) {
		var setter = 2;

		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {
			return jQuery.queue( this[ 0 ], type );
		}

		return data === undefined ?
			this :
			this.each( function() {
				var queue = jQuery.queue( this, type, data );

				// Ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[ 0 ] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			} );
	},
	dequeue: function( type ) {
		return this.each( function() {
			jQuery.dequeue( this, type );
		} );
	},
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},

	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, obj ) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while ( i-- ) {
			tmp = dataPriv.get( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
} );
var pnum = ( /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/ ).source;

var rcssNum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" );


var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

var isHiddenWithinTree = function( elem, el ) {

		// isHiddenWithinTree might be called from jQuery#filter function;
		// in that case, element will be second argument
		elem = el || elem;

		// Inline style trumps all
		return elem.style.display === "none" ||
			elem.style.display === "" &&

			// Otherwise, check computed style
			// Support: Firefox <=43 - 45
			// Disconnected elements can have computed display: none, so first confirm that elem is
			// in the document.
			jQuery.contains( elem.ownerDocument, elem ) &&

			jQuery.css( elem, "display" ) === "none";
	};

var swap = function( elem, options, callback, args ) {
	var ret, name,
		old = {};

	// Remember the old values, and insert the new ones
	for ( name in options ) {
		old[ name ] = elem.style[ name ];
		elem.style[ name ] = options[ name ];
	}

	ret = callback.apply( elem, args || [] );

	// Revert the old values
	for ( name in options ) {
		elem.style[ name ] = old[ name ];
	}

	return ret;
};




function adjustCSS( elem, prop, valueParts, tween ) {
	var adjusted, scale,
		maxIterations = 20,
		currentValue = tween ?
			function() {
				return tween.cur();
			} :
			function() {
				return jQuery.css( elem, prop, "" );
			},
		initial = currentValue(),
		unit = valueParts && valueParts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

		// Starting value computation is required for potential unit mismatches
		initialInUnit = ( jQuery.cssNumber[ prop ] || unit !== "px" && +initial ) &&
			rcssNum.exec( jQuery.css( elem, prop ) );

	if ( initialInUnit && initialInUnit[ 3 ] !== unit ) {

		// Support: Firefox <=54
		// Halve the iteration target value to prevent interference from CSS upper bounds (gh-2144)
		initial = initial / 2;

		// Trust units reported by jQuery.css
		unit = unit || initialInUnit[ 3 ];

		// Iteratively approximate from a nonzero starting point
		initialInUnit = +initial || 1;

		while ( maxIterations-- ) {

			// Evaluate and update our best guess (doubling guesses that zero out).
			// Finish if the scale equals or crosses 1 (making the old*new product non-positive).
			jQuery.style( elem, prop, initialInUnit + unit );
			if ( ( 1 - scale ) * ( 1 - ( scale = currentValue() / initial || 0.5 ) ) <= 0 ) {
				maxIterations = 0;
			}
			initialInUnit = initialInUnit / scale;

		}

		initialInUnit = initialInUnit * 2;
		jQuery.style( elem, prop, initialInUnit + unit );

		// Make sure we update the tween properties later on
		valueParts = valueParts || [];
	}

	if ( valueParts ) {
		initialInUnit = +initialInUnit || +initial || 0;

		// Apply relative offset (+=/-=) if specified
		adjusted = valueParts[ 1 ] ?
			initialInUnit + ( valueParts[ 1 ] + 1 ) * valueParts[ 2 ] :
			+valueParts[ 2 ];
		if ( tween ) {
			tween.unit = unit;
			tween.start = initialInUnit;
			tween.end = adjusted;
		}
	}
	return adjusted;
}


var defaultDisplayMap = {};

function getDefaultDisplay( elem ) {
	var temp,
		doc = elem.ownerDocument,
		nodeName = elem.nodeName,
		display = defaultDisplayMap[ nodeName ];

	if ( display ) {
		return display;
	}

	temp = doc.body.appendChild( doc.createElement( nodeName ) );
	display = jQuery.css( temp, "display" );

	temp.parentNode.removeChild( temp );

	if ( display === "none" ) {
		display = "block";
	}
	defaultDisplayMap[ nodeName ] = display;

	return display;
}

function showHide( elements, show ) {
	var display, elem,
		values = [],
		index = 0,
		length = elements.length;

	// Determine new display value for elements that need to change
	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}

		display = elem.style.display;
		if ( show ) {

			// Since we force visibility upon cascade-hidden elements, an immediate (and slow)
			// check is required in this first loop unless we have a nonempty display value (either
			// inline or about-to-be-restored)
			if ( display === "none" ) {
				values[ index ] = dataPriv.get( elem, "display" ) || null;
				if ( !values[ index ] ) {
					elem.style.display = "";
				}
			}
			if ( elem.style.display === "" && isHiddenWithinTree( elem ) ) {
				values[ index ] = getDefaultDisplay( elem );
			}
		} else {
			if ( display !== "none" ) {
				values[ index ] = "none";

				// Remember what we're overwriting
				dataPriv.set( elem, "display", display );
			}
		}
	}

	// Set the display of the elements in a second loop to avoid constant reflow
	for ( index = 0; index < length; index++ ) {
		if ( values[ index ] != null ) {
			elements[ index ].style.display = values[ index ];
		}
	}

	return elements;
}

jQuery.fn.extend( {
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state ) {
		if ( typeof state === "boolean" ) {
			return state ? this.show() : this.hide();
		}

		return this.each( function() {
			if ( isHiddenWithinTree( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		} );
	}
} );
var rcheckableType = ( /^(?:checkbox|radio)$/i );

var rtagName = ( /<([a-z][^\/\0>\x20\t\r\n\f]+)/i );

var rscriptType = ( /^$|^module$|\/(?:java|ecma)script/i );



// We have to close these tags to support XHTML (#13200)
var wrapMap = {

	// Support: IE <=9 only
	option: [ 1, "<select multiple='multiple'>", "</select>" ],

	// XHTML parsers do not magically insert elements in the
	// same way that tag soup parsers do. So we cannot shorten
	// this by omitting <tbody> or other required elements.
	thead: [ 1, "<table>", "</table>" ],
	col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
	tr: [ 2, "<table><tbody>", "</tbody></table>" ],
	td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

	_default: [ 0, "", "" ]
};

// Support: IE <=9 only
wrapMap.optgroup = wrapMap.option;

wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;


function getAll( context, tag ) {

	// Support: IE <=9 - 11 only
	// Use typeof to avoid zero-argument method invocation on host objects (#15151)
	var ret;

	if ( typeof context.getElementsByTagName !== "undefined" ) {
		ret = context.getElementsByTagName( tag || "*" );

	} else if ( typeof context.querySelectorAll !== "undefined" ) {
		ret = context.querySelectorAll( tag || "*" );

	} else {
		ret = [];
	}

	if ( tag === undefined || tag && nodeName( context, tag ) ) {
		return jQuery.merge( [ context ], ret );
	}

	return ret;
}


// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
	var i = 0,
		l = elems.length;

	for ( ; i < l; i++ ) {
		dataPriv.set(
			elems[ i ],
			"globalEval",
			!refElements || dataPriv.get( refElements[ i ], "globalEval" )
		);
	}
}


var rhtml = /<|&#?\w+;/;

function buildFragment( elems, context, scripts, selection, ignored ) {
	var elem, tmp, tag, wrap, contains, j,
		fragment = context.createDocumentFragment(),
		nodes = [],
		i = 0,
		l = elems.length;

	for ( ; i < l; i++ ) {
		elem = elems[ i ];

		if ( elem || elem === 0 ) {

			// Add nodes directly
			if ( toType( elem ) === "object" ) {

				// Support: Android <=4.0 only, PhantomJS 1 only
				// push.apply(_, arraylike) throws on ancient WebKit
				jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

			// Convert non-html into a text node
			} else if ( !rhtml.test( elem ) ) {
				nodes.push( context.createTextNode( elem ) );

			// Convert html into DOM nodes
			} else {
				tmp = tmp || fragment.appendChild( context.createElement( "div" ) );

				// Deserialize a standard representation
				tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
				wrap = wrapMap[ tag ] || wrapMap._default;
				tmp.innerHTML = wrap[ 1 ] + jQuery.htmlPrefilter( elem ) + wrap[ 2 ];

				// Descend through wrappers to the right content
				j = wrap[ 0 ];
				while ( j-- ) {
					tmp = tmp.lastChild;
				}

				// Support: Android <=4.0 only, PhantomJS 1 only
				// push.apply(_, arraylike) throws on ancient WebKit
				jQuery.merge( nodes, tmp.childNodes );

				// Remember the top-level container
				tmp = fragment.firstChild;

				// Ensure the created nodes are orphaned (#12392)
				tmp.textContent = "";
			}
		}
	}

	// Remove wrapper from fragment
	fragment.textContent = "";

	i = 0;
	while ( ( elem = nodes[ i++ ] ) ) {

		// Skip elements already in the context collection (trac-4087)
		if ( selection && jQuery.inArray( elem, selection ) > -1 ) {
			if ( ignored ) {
				ignored.push( elem );
			}
			continue;
		}

		contains = jQuery.contains( elem.ownerDocument, elem );

		// Append to fragment
		tmp = getAll( fragment.appendChild( elem ), "script" );

		// Preserve script evaluation history
		if ( contains ) {
			setGlobalEval( tmp );
		}

		// Capture executables
		if ( scripts ) {
			j = 0;
			while ( ( elem = tmp[ j++ ] ) ) {
				if ( rscriptType.test( elem.type || "" ) ) {
					scripts.push( elem );
				}
			}
		}
	}

	return fragment;
}


( function() {
	var fragment = document.createDocumentFragment(),
		div = fragment.appendChild( document.createElement( "div" ) ),
		input = document.createElement( "input" );

	// Support: Android 4.0 - 4.3 only
	// Check state lost if the name is set (#11217)
	// Support: Windows Web Apps (WWA)
	// `name` and `type` must use .setAttribute for WWA (#14901)
	input.setAttribute( "type", "radio" );
	input.setAttribute( "checked", "checked" );
	input.setAttribute( "name", "t" );

	div.appendChild( input );

	// Support: Android <=4.1 only
	// Older WebKit doesn't clone checked state correctly in fragments
	support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: IE <=11 only
	// Make sure textarea (and checkbox) defaultValue is properly cloned
	div.innerHTML = "<textarea>x</textarea>";
	support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;
} )();
var documentElement = document.documentElement;



var
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|pointer|contextmenu|drag|drop)|click/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

// Support: IE <=9 only
// See #13393 for more info
function safeActiveElement() {
	try {
		return document.activeElement;
	} catch ( err ) { }
}

function on( elem, types, selector, data, fn, one ) {
	var origFn, type;

	// Types can be a map of types/handlers
	if ( typeof types === "object" ) {

		// ( types-Object, selector, data )
		if ( typeof selector !== "string" ) {

			// ( types-Object, data )
			data = data || selector;
			selector = undefined;
		}
		for ( type in types ) {
			on( elem, type, selector, data, types[ type ], one );
		}
		return elem;
	}

	if ( data == null && fn == null ) {

		// ( types, fn )
		fn = selector;
		data = selector = undefined;
	} else if ( fn == null ) {
		if ( typeof selector === "string" ) {

			// ( types, selector, fn )
			fn = data;
			data = undefined;
		} else {

			// ( types, data, fn )
			fn = data;
			data = selector;
			selector = undefined;
		}
	}
	if ( fn === false ) {
		fn = returnFalse;
	} else if ( !fn ) {
		return elem;
	}

	if ( one === 1 ) {
		origFn = fn;
		fn = function( event ) {

			// Can use an empty set, since event contains the info
			jQuery().off( event );
			return origFn.apply( this, arguments );
		};

		// Use same guid so caller can remove using origFn
		fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
	}
	return elem.each( function() {
		jQuery.event.add( this, types, fn, data, selector );
	} );
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	global: {},

	add: function( elem, types, handler, data, selector ) {

		var handleObjIn, eventHandle, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = dataPriv.get( elem );

		// Don't attach events to noData or text/comment nodes (but allow plain objects)
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Ensure that invalid selectors throw exceptions at attach time
		// Evaluate against documentElement in case elem is a non-element node (e.g., document)
		if ( selector ) {
			jQuery.find.matchesSelector( documentElement, selector );
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		if ( !( events = elemData.events ) ) {
			events = elemData.events = {};
		}
		if ( !( eventHandle = elemData.handle ) ) {
			eventHandle = elemData.handle = function( e ) {

				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
					jQuery.event.dispatch.apply( elem, arguments ) : undefined;
			};
		}

		// Handle multiple events separated by a space
		types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[ t ] ) || [];
			type = origType = tmp[ 1 ];
			namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

			// There *must* be a type, no attaching namespace-only handlers
			if ( !type ) {
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend( {
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join( "." )
			}, handleObjIn );

			// Init the event handler queue if we're the first
			if ( !( handlers = events[ type ] ) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener if the special events handler returns false
				if ( !special.setup ||
					special.setup.call( elem, data, namespaces, eventHandle ) === false ) {

					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

	},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {

		var j, origCount, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = dataPriv.hasData( elem ) && dataPriv.get( elem );

		if ( !elemData || !( events = elemData.events ) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[ t ] ) || [];
			type = origType = tmp[ 1 ];
			namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[ 2 ] &&
				new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector ||
						selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown ||
					special.teardown.call( elem, namespaces, elemData.handle ) === false ) {

					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove data and the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			dataPriv.remove( elem, "handle events" );
		}
	},

	dispatch: function( nativeEvent ) {

		// Make a writable jQuery.Event from the native event object
		var event = jQuery.event.fix( nativeEvent );

		var i, j, ret, matched, handleObj, handlerQueue,
			args = new Array( arguments.length ),
			handlers = ( dataPriv.get( this, "events" ) || {} )[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[ 0 ] = event;

		for ( i = 1; i < arguments.length; i++ ) {
			args[ i ] = arguments[ i ];
		}

		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( ( matched = handlerQueue[ i++ ] ) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
			while ( ( handleObj = matched.handlers[ j++ ] ) &&
				!event.isImmediatePropagationStopped() ) {

				// Triggered event must either 1) have no namespace, or 2) have namespace(s)
				// a subset or equal to those in the bound event (both can have no namespace).
				if ( !event.rnamespace || event.rnamespace.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( ( jQuery.event.special[ handleObj.origType ] || {} ).handle ||
						handleObj.handler ).apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( ( event.result = ret ) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function( event, handlers ) {
		var i, handleObj, sel, matchedHandlers, matchedSelectors,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		if ( delegateCount &&

			// Support: IE <=9
			// Black-hole SVG <use> instance trees (trac-13180)
			cur.nodeType &&

			// Support: Firefox <=42
			// Suppress spec-violating clicks indicating a non-primary pointer button (trac-3861)
			// https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
			// Support: IE 11 only
			// ...but not arrow key "clicks" of radio inputs, which can have `button` -1 (gh-2343)
			!( event.type === "click" && event.button >= 1 ) ) {

			for ( ; cur !== this; cur = cur.parentNode || this ) {

				// Don't check non-elements (#13208)
				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.nodeType === 1 && !( event.type === "click" && cur.disabled === true ) ) {
					matchedHandlers = [];
					matchedSelectors = {};
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matchedSelectors[ sel ] === undefined ) {
							matchedSelectors[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) > -1 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matchedSelectors[ sel ] ) {
							matchedHandlers.push( handleObj );
						}
					}
					if ( matchedHandlers.length ) {
						handlerQueue.push( { elem: cur, handlers: matchedHandlers } );
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		cur = this;
		if ( delegateCount < handlers.length ) {
			handlerQueue.push( { elem: cur, handlers: handlers.slice( delegateCount ) } );
		}

		return handlerQueue;
	},

	addProp: function( name, hook ) {
		Object.defineProperty( jQuery.Event.prototype, name, {
			enumerable: true,
			configurable: true,

			get: isFunction( hook ) ?
				function() {
					if ( this.originalEvent ) {
							return hook( this.originalEvent );
					}
				} :
				function() {
					if ( this.originalEvent ) {
							return this.originalEvent[ name ];
					}
				},

			set: function( value ) {
				Object.defineProperty( this, name, {
					enumerable: true,
					configurable: true,
					writable: true,
					value: value
				} );
			}
		} );
	},

	fix: function( originalEvent ) {
		return originalEvent[ jQuery.expando ] ?
			originalEvent :
			new jQuery.Event( originalEvent );
	},

	special: {
		load: {

			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		focus: {

			// Fire native event if possible so blur/focus sequence is correct
			trigger: function() {
				if ( this !== safeActiveElement() && this.focus ) {
					this.focus();
					return false;
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function() {
				if ( this === safeActiveElement() && this.blur ) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},
		click: {

			// For checkbox, fire native event so checked state will be right
			trigger: function() {
				if ( this.type === "checkbox" && this.click && nodeName( this, "input" ) ) {
					this.click();
					return false;
				}
			},

			// For cross-browser consistency, don't fire native .click() on links
			_default: function( event ) {
				return nodeName( event.target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Support: Firefox 20+
				// Firefox doesn't alert if the returnValue field is not set.
				if ( event.result !== undefined && event.originalEvent ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	}
};

jQuery.removeEvent = function( elem, type, handle ) {

	// This "if" is needed for plain objects
	if ( elem.removeEventListener ) {
		elem.removeEventListener( type, handle );
	}
};

jQuery.Event = function( src, props ) {

	// Allow instantiation without the 'new' keyword
	if ( !( this instanceof jQuery.Event ) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = src.defaultPrevented ||
				src.defaultPrevented === undefined &&

				// Support: Android <=2.3 only
				src.returnValue === false ?
			returnTrue :
			returnFalse;

		// Create target properties
		// Support: Safari <=6 - 7 only
		// Target should not be a text node (#504, #13143)
		this.target = ( src.target && src.target.nodeType === 3 ) ?
			src.target.parentNode :
			src.target;

		this.currentTarget = src.currentTarget;
		this.relatedTarget = src.relatedTarget;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || Date.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// https://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	constructor: jQuery.Event,
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,
	isSimulated: false,

	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;

		if ( e && !this.isSimulated ) {
			e.preventDefault();
		}
	},
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;

		if ( e && !this.isSimulated ) {
			e.stopPropagation();
		}
	},
	stopImmediatePropagation: function() {
		var e = this.originalEvent;

		this.isImmediatePropagationStopped = returnTrue;

		if ( e && !this.isSimulated ) {
			e.stopImmediatePropagation();
		}

		this.stopPropagation();
	}
};

// Includes all common event props including KeyEvent and MouseEvent specific props
jQuery.each( {
	altKey: true,
	bubbles: true,
	cancelable: true,
	changedTouches: true,
	ctrlKey: true,
	detail: true,
	eventPhase: true,
	metaKey: true,
	pageX: true,
	pageY: true,
	shiftKey: true,
	view: true,
	"char": true,
	charCode: true,
	key: true,
	keyCode: true,
	button: true,
	buttons: true,
	clientX: true,
	clientY: true,
	offsetX: true,
	offsetY: true,
	pointerId: true,
	pointerType: true,
	screenX: true,
	screenY: true,
	targetTouches: true,
	toElement: true,
	touches: true,

	which: function( event ) {
		var button = event.button;

		// Add which for key events
		if ( event.which == null && rkeyEvent.test( event.type ) ) {
			return event.charCode != null ? event.charCode : event.keyCode;
		}

		// Add which for click: 1 === left; 2 === middle; 3 === right
		if ( !event.which && button !== undefined && rmouseEvent.test( event.type ) ) {
			if ( button & 1 ) {
				return 1;
			}

			if ( button & 2 ) {
				return 3;
			}

			if ( button & 4 ) {
				return 2;
			}

			return 0;
		}

		return event.which;
	}
}, jQuery.event.addProp );

// Create mouseenter/leave events using mouseover/out and event-time checks
// so that event delegation works in jQuery.
// Do the same for pointerenter/pointerleave and pointerover/pointerout
//
// Support: Safari 7 only
// Safari sends mouseenter too often; see:
// https://bugs.chromium.org/p/chromium/issues/detail?id=470258
// for the description of the bug (it existed in older Chrome versions as well).
jQuery.each( {
	mouseenter: "mouseover",
	mouseleave: "mouseout",
	pointerenter: "pointerover",
	pointerleave: "pointerout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mouseenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || ( related !== target && !jQuery.contains( target, related ) ) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
} );

jQuery.fn.extend( {

	on: function( types, selector, data, fn ) {
		return on( this, types, selector, data, fn );
	},
	one: function( types, selector, data, fn ) {
		return on( this, types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {

			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ?
					handleObj.origType + "." + handleObj.namespace :
					handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {

			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {

			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each( function() {
			jQuery.event.remove( this, types, fn, selector );
		} );
	}
} );


var

	/* eslint-disable max-len */

	// See https://github.com/eslint/eslint/issues/3229
	rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,

	/* eslint-enable */

	// Support: IE <=10 - 11, Edge 12 - 13 only
	// In IE/Edge using regex groups here causes severe slowdowns.
	// See https://connect.microsoft.com/IE/feedback/details/1736512/
	rnoInnerhtml = /<script|<style|<link/i,

	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;

// Prefer a tbody over its parent table for containing new rows
function manipulationTarget( elem, content ) {
	if ( nodeName( elem, "table" ) &&
		nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ) {

		return jQuery( elem ).children( "tbody" )[ 0 ] || elem;
	}

	return elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
	elem.type = ( elem.getAttribute( "type" ) !== null ) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {
	if ( ( elem.type || "" ).slice( 0, 5 ) === "true/" ) {
		elem.type = elem.type.slice( 5 );
	} else {
		elem.removeAttribute( "type" );
	}

	return elem;
}

function cloneCopyEvent( src, dest ) {
	var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;

	if ( dest.nodeType !== 1 ) {
		return;
	}

	// 1. Copy private data: events, handlers, etc.
	if ( dataPriv.hasData( src ) ) {
		pdataOld = dataPriv.access( src );
		pdataCur = dataPriv.set( dest, pdataOld );
		events = pdataOld.events;

		if ( events ) {
			delete pdataCur.handle;
			pdataCur.events = {};

			for ( type in events ) {
				for ( i = 0, l = events[ type ].length; i < l; i++ ) {
					jQuery.event.add( dest, type, events[ type ][ i ] );
				}
			}
		}
	}

	// 2. Copy user data
	if ( dataUser.hasData( src ) ) {
		udataOld = dataUser.access( src );
		udataCur = jQuery.extend( {}, udataOld );

		dataUser.set( dest, udataCur );
	}
}

// Fix IE bugs, see support tests
function fixInput( src, dest ) {
	var nodeName = dest.nodeName.toLowerCase();

	// Fails to persist the checked state of a cloned checkbox or radio button.
	if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
		dest.checked = src.checked;

	// Fails to return the selected option to the default selected state when cloning options
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}
}

function domManip( collection, args, callback, ignored ) {

	// Flatten any nested arrays
	args = concat.apply( [], args );

	var fragment, first, scripts, hasScripts, node, doc,
		i = 0,
		l = collection.length,
		iNoClone = l - 1,
		value = args[ 0 ],
		valueIsFunction = isFunction( value );

	// We can't cloneNode fragments that contain checked, in WebKit
	if ( valueIsFunction ||
			( l > 1 && typeof value === "string" &&
				!support.checkClone && rchecked.test( value ) ) ) {
		return collection.each( function( index ) {
			var self = collection.eq( index );
			if ( valueIsFunction ) {
				args[ 0 ] = value.call( this, index, self.html() );
			}
			domManip( self, args, callback, ignored );
		} );
	}

	if ( l ) {
		fragment = buildFragment( args, collection[ 0 ].ownerDocument, false, collection, ignored );
		first = fragment.firstChild;

		if ( fragment.childNodes.length === 1 ) {
			fragment = first;
		}

		// Require either new content or an interest in ignored elements to invoke the callback
		if ( first || ignored ) {
			scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
			hasScripts = scripts.length;

			// Use the original fragment for the last item
			// instead of the first because it can end up
			// being emptied incorrectly in certain situations (#8070).
			for ( ; i < l; i++ ) {
				node = fragment;

				if ( i !== iNoClone ) {
					node = jQuery.clone( node, true, true );

					// Keep references to cloned scripts for later restoration
					if ( hasScripts ) {

						// Support: Android <=4.0 only, PhantomJS 1 only
						// push.apply(_, arraylike) throws on ancient WebKit
						jQuery.merge( scripts, getAll( node, "script" ) );
					}
				}

				callback.call( collection[ i ], node, i );
			}

			if ( hasScripts ) {
				doc = scripts[ scripts.length - 1 ].ownerDocument;

				// Reenable scripts
				jQuery.map( scripts, restoreScript );

				// Evaluate executable scripts on first document insertion
				for ( i = 0; i < hasScripts; i++ ) {
					node = scripts[ i ];
					if ( rscriptType.test( node.type || "" ) &&
						!dataPriv.access( node, "globalEval" ) &&
						jQuery.contains( doc, node ) ) {

						if ( node.src && ( node.type || "" ).toLowerCase()  !== "module" ) {

							// Optional AJAX dependency, but won't run scripts if not present
							if ( jQuery._evalUrl ) {
								jQuery._evalUrl( node.src );
							}
						} else {
							DOMEval( node.textContent.replace( rcleanScript, "" ), doc, node );
						}
					}
				}
			}
		}
	}

	return collection;
}

function remove( elem, selector, keepData ) {
	var node,
		nodes = selector ? jQuery.filter( selector, elem ) : elem,
		i = 0;

	for ( ; ( node = nodes[ i ] ) != null; i++ ) {
		if ( !keepData && node.nodeType === 1 ) {
			jQuery.cleanData( getAll( node ) );
		}

		if ( node.parentNode ) {
			if ( keepData && jQuery.contains( node.ownerDocument, node ) ) {
				setGlobalEval( getAll( node, "script" ) );
			}
			node.parentNode.removeChild( node );
		}
	}

	return elem;
}

jQuery.extend( {
	htmlPrefilter: function( html ) {
		return html.replace( rxhtmlTag, "<$1></$2>" );
	},

	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var i, l, srcElements, destElements,
			clone = elem.cloneNode( true ),
			inPage = jQuery.contains( elem.ownerDocument, elem );

		// Fix IE cloning issues
		if ( !support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) &&
				!jQuery.isXMLDoc( elem ) ) {

			// We eschew Sizzle here for performance reasons: https://jsperf.com/getall-vs-sizzle/2
			destElements = getAll( clone );
			srcElements = getAll( elem );

			for ( i = 0, l = srcElements.length; i < l; i++ ) {
				fixInput( srcElements[ i ], destElements[ i ] );
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			if ( deepDataAndEvents ) {
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0, l = srcElements.length; i < l; i++ ) {
					cloneCopyEvent( srcElements[ i ], destElements[ i ] );
				}
			} else {
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		// Return the cloned set
		return clone;
	},

	cleanData: function( elems ) {
		var data, elem, type,
			special = jQuery.event.special,
			i = 0;

		for ( ; ( elem = elems[ i ] ) !== undefined; i++ ) {
			if ( acceptData( elem ) ) {
				if ( ( data = elem[ dataPriv.expando ] ) ) {
					if ( data.events ) {
						for ( type in data.events ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}

					// Support: Chrome <=35 - 45+
					// Assign undefined instead of using delete, see Data#remove
					elem[ dataPriv.expando ] = undefined;
				}
				if ( elem[ dataUser.expando ] ) {

					// Support: Chrome <=35 - 45+
					// Assign undefined instead of using delete, see Data#remove
					elem[ dataUser.expando ] = undefined;
				}
			}
		}
	}
} );

jQuery.fn.extend( {
	detach: function( selector ) {
		return remove( this, selector, true );
	},

	remove: function( selector ) {
		return remove( this, selector );
	},

	text: function( value ) {
		return access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().each( function() {
					if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
						this.textContent = value;
					}
				} );
		}, null, value, arguments.length );
	},

	append: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.appendChild( elem );
			}
		} );
	},

	prepend: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.insertBefore( elem, target.firstChild );
			}
		} );
	},

	before: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this );
			}
		} );
	},

	after: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		} );
	},

	empty: function() {
		var elem,
			i = 0;

		for ( ; ( elem = this[ i ] ) != null; i++ ) {
			if ( elem.nodeType === 1 ) {

				// Prevent memory leaks
				jQuery.cleanData( getAll( elem, false ) );

				// Remove any remaining nodes
				elem.textContent = "";
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map( function() {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		} );
	},

	html: function( value ) {
		return access( this, function( value ) {
			var elem = this[ 0 ] || {},
				i = 0,
				l = this.length;

			if ( value === undefined && elem.nodeType === 1 ) {
				return elem.innerHTML;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

				value = jQuery.htmlPrefilter( value );

				try {
					for ( ; i < l; i++ ) {
						elem = this[ i ] || {};

						// Remove element nodes and prevent memory leaks
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch ( e ) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function() {
		var ignored = [];

		// Make the changes, replacing each non-ignored context element with the new content
		return domManip( this, arguments, function( elem ) {
			var parent = this.parentNode;

			if ( jQuery.inArray( this, ignored ) < 0 ) {
				jQuery.cleanData( getAll( this ) );
				if ( parent ) {
					parent.replaceChild( elem, this );
				}
			}

		// Force callback invocation
		}, ignored );
	}
} );

jQuery.each( {
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var elems,
			ret = [],
			insert = jQuery( selector ),
			last = insert.length - 1,
			i = 0;

		for ( ; i <= last; i++ ) {
			elems = i === last ? this : this.clone( true );
			jQuery( insert[ i ] )[ original ]( elems );

			// Support: Android <=4.0 only, PhantomJS 1 only
			// .get() because push.apply(_, arraylike) throws on ancient WebKit
			push.apply( ret, elems.get() );
		}

		return this.pushStack( ret );
	};
} );
var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );

var getStyles = function( elem ) {

		// Support: IE <=11 only, Firefox <=30 (#15098, #14150)
		// IE throws on elements created in popups
		// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
		var view = elem.ownerDocument.defaultView;

		if ( !view || !view.opener ) {
			view = window;
		}

		return view.getComputedStyle( elem );
	};

var rboxStyle = new RegExp( cssExpand.join( "|" ), "i" );



( function() {

	// Executing both pixelPosition & boxSizingReliable tests require only one layout
	// so they're executed at the same time to save the second computation.
	function computeStyleTests() {

		// This is a singleton, we need to execute it only once
		if ( !div ) {
			return;
		}

		container.style.cssText = "position:absolute;left:-11111px;width:60px;" +
			"margin-top:1px;padding:0;border:0";
		div.style.cssText =
			"position:relative;display:block;box-sizing:border-box;overflow:scroll;" +
			"margin:auto;border:1px;padding:1px;" +
			"width:60%;top:1%";
		documentElement.appendChild( container ).appendChild( div );

		var divStyle = window.getComputedStyle( div );
		pixelPositionVal = divStyle.top !== "1%";

		// Support: Android 4.0 - 4.3 only, Firefox <=3 - 44
		reliableMarginLeftVal = roundPixelMeasures( divStyle.marginLeft ) === 12;

		// Support: Android 4.0 - 4.3 only, Safari <=9.1 - 10.1, iOS <=7.0 - 9.3
		// Some styles come back with percentage values, even though they shouldn't
		div.style.right = "60%";
		pixelBoxStylesVal = roundPixelMeasures( divStyle.right ) === 36;

		// Support: IE 9 - 11 only
		// Detect misreporting of content dimensions for box-sizing:border-box elements
		boxSizingReliableVal = roundPixelMeasures( divStyle.width ) === 36;

		// Support: IE 9 only
		// Detect overflow:scroll screwiness (gh-3699)
		div.style.position = "absolute";
		scrollboxSizeVal = div.offsetWidth === 36 || "absolute";

		documentElement.removeChild( container );

		// Nullify the div so it wouldn't be stored in the memory and
		// it will also be a sign that checks already performed
		div = null;
	}

	function roundPixelMeasures( measure ) {
		return Math.round( parseFloat( measure ) );
	}

	var pixelPositionVal, boxSizingReliableVal, scrollboxSizeVal, pixelBoxStylesVal,
		reliableMarginLeftVal,
		container = document.createElement( "div" ),
		div = document.createElement( "div" );

	// Finish early in limited (non-browser) environments
	if ( !div.style ) {
		return;
	}

	// Support: IE <=9 - 11 only
	// Style of cloned element affects source element cloned (#8908)
	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	jQuery.extend( support, {
		boxSizingReliable: function() {
			computeStyleTests();
			return boxSizingReliableVal;
		},
		pixelBoxStyles: function() {
			computeStyleTests();
			return pixelBoxStylesVal;
		},
		pixelPosition: function() {
			computeStyleTests();
			return pixelPositionVal;
		},
		reliableMarginLeft: function() {
			computeStyleTests();
			return reliableMarginLeftVal;
		},
		scrollboxSize: function() {
			computeStyleTests();
			return scrollboxSizeVal;
		}
	} );
} )();


function curCSS( elem, name, computed ) {
	var width, minWidth, maxWidth, ret,

		// Support: Firefox 51+
		// Retrieving style before computed somehow
		// fixes an issue with getting wrong values
		// on detached elements
		style = elem.style;

	computed = computed || getStyles( elem );

	// getPropertyValue is needed for:
	//   .css('filter') (IE 9 only, #12537)
	//   .css('--customProperty) (#3144)
	if ( computed ) {
		ret = computed.getPropertyValue( name ) || computed[ name ];

		if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
			ret = jQuery.style( elem, name );
		}

		// A tribute to the "awesome hack by Dean Edwards"
		// Android Browser returns percentage for some values,
		// but width seems to be reliably pixels.
		// This is against the CSSOM draft spec:
		// https://drafts.csswg.org/cssom/#resolved-values
		if ( !support.pixelBoxStyles() && rnumnonpx.test( ret ) && rboxStyle.test( name ) ) {

			// Remember the original values
			width = style.width;
			minWidth = style.minWidth;
			maxWidth = style.maxWidth;

			// Put in the new values to get a computed value out
			style.minWidth = style.maxWidth = style.width = ret;
			ret = computed.width;

			// Revert the changed values
			style.width = width;
			style.minWidth = minWidth;
			style.maxWidth = maxWidth;
		}
	}

	return ret !== undefined ?

		// Support: IE <=9 - 11 only
		// IE returns zIndex value as an integer.
		ret + "" :
		ret;
}


function addGetHookIf( conditionFn, hookFn ) {

	// Define the hook, we'll check on the first run if it's really needed.
	return {
		get: function() {
			if ( conditionFn() ) {

				// Hook not needed (or it's not possible to use it due
				// to missing dependency), remove it.
				delete this.get;
				return;
			}

			// Hook needed; redefine it so that the support test is not executed again.
			return ( this.get = hookFn ).apply( this, arguments );
		}
	};
}


var

	// Swappable if display is none or starts with table
	// except "table", "table-cell", or "table-caption"
	// See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rcustomProp = /^--/,
	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: "0",
		fontWeight: "400"
	},

	cssPrefixes = [ "Webkit", "Moz", "ms" ],
	emptyStyle = document.createElement( "div" ).style;

// Return a css property mapped to a potentially vendor prefixed property
function vendorPropName( name ) {

	// Shortcut for names that are not vendor prefixed
	if ( name in emptyStyle ) {
		return name;
	}

	// Check for vendor prefixed names
	var capName = name[ 0 ].toUpperCase() + name.slice( 1 ),
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in emptyStyle ) {
			return name;
		}
	}
}

// Return a property mapped along what jQuery.cssProps suggests or to
// a vendor prefixed property.
function finalPropName( name ) {
	var ret = jQuery.cssProps[ name ];
	if ( !ret ) {
		ret = jQuery.cssProps[ name ] = vendorPropName( name ) || name;
	}
	return ret;
}

function setPositiveNumber( elem, value, subtract ) {

	// Any relative (+/-) values have already been
	// normalized at this point
	var matches = rcssNum.exec( value );
	return matches ?

		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 2 ] - ( subtract || 0 ) ) + ( matches[ 3 ] || "px" ) :
		value;
}

function boxModelAdjustment( elem, dimension, box, isBorderBox, styles, computedVal ) {
	var i = dimension === "width" ? 1 : 0,
		extra = 0,
		delta = 0;

	// Adjustment may not be necessary
	if ( box === ( isBorderBox ? "border" : "content" ) ) {
		return 0;
	}

	for ( ; i < 4; i += 2 ) {

		// Both box models exclude margin
		if ( box === "margin" ) {
			delta += jQuery.css( elem, box + cssExpand[ i ], true, styles );
		}

		// If we get here with a content-box, we're seeking "padding" or "border" or "margin"
		if ( !isBorderBox ) {

			// Add padding
			delta += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// For "border" or "margin", add border
			if ( box !== "padding" ) {
				delta += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );

			// But still keep track of it otherwise
			} else {
				extra += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}

		// If we get here with a border-box (content + padding + border), we're seeking "content" or
		// "padding" or "margin"
		} else {

			// For "content", subtract padding
			if ( box === "content" ) {
				delta -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// For "content" or "padding", subtract border
			if ( box !== "margin" ) {
				delta -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	// Account for positive content-box scroll gutter when requested by providing computedVal
	if ( !isBorderBox && computedVal >= 0 ) {

		// offsetWidth/offsetHeight is a rounded sum of content, padding, scroll gutter, and border
		// Assuming integer scroll gutter, subtract the rest and round down
		delta += Math.max( 0, Math.ceil(
			elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ] -
			computedVal -
			delta -
			extra -
			0.5
		) );
	}

	return delta;
}

function getWidthOrHeight( elem, dimension, extra ) {

	// Start with computed style
	var styles = getStyles( elem ),
		val = curCSS( elem, dimension, styles ),
		isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
		valueIsBorderBox = isBorderBox;

	// Support: Firefox <=54
	// Return a confounding non-pixel value or feign ignorance, as appropriate.
	if ( rnumnonpx.test( val ) ) {
		if ( !extra ) {
			return val;
		}
		val = "auto";
	}

	// Check for style in case a browser which returns unreliable values
	// for getComputedStyle silently falls back to the reliable elem.style
	valueIsBorderBox = valueIsBorderBox &&
		( support.boxSizingReliable() || val === elem.style[ dimension ] );

	// Fall back to offsetWidth/offsetHeight when value is "auto"
	// This happens for inline elements with no explicit setting (gh-3571)
	// Support: Android <=4.1 - 4.3 only
	// Also use offsetWidth/offsetHeight for misreported inline dimensions (gh-3602)
	if ( val === "auto" ||
		!parseFloat( val ) && jQuery.css( elem, "display", false, styles ) === "inline" ) {

		val = elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ];

		// offsetWidth/offsetHeight provide border-box values
		valueIsBorderBox = true;
	}

	// Normalize "" and auto
	val = parseFloat( val ) || 0;

	// Adjust for the element's box model
	return ( val +
		boxModelAdjustment(
			elem,
			dimension,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox,
			styles,

			// Provide the current computed size to request scroll gutter calculation (gh-3589)
			val
		)
	) + "px";
}

jQuery.extend( {

	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {

					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Don't automatically add "px" to these possibly-unitless properties
	cssNumber: {
		"animationIterationCount": true,
		"columnCount": true,
		"fillOpacity": true,
		"flexGrow": true,
		"flexShrink": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"order": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {

		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = camelCase( name ),
			isCustomProp = rcustomProp.test( name ),
			style = elem.style;

		// Make sure that we're working with the right name. We don't
		// want to query the value if it is a CSS custom property
		// since they are user-defined.
		if ( !isCustomProp ) {
			name = finalPropName( origName );
		}

		// Gets hook for the prefixed version, then unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// Convert "+=" or "-=" to relative numbers (#7345)
			if ( type === "string" && ( ret = rcssNum.exec( value ) ) && ret[ 1 ] ) {
				value = adjustCSS( elem, name, ret );

				// Fixes bug #9237
				type = "number";
			}

			// Make sure that null and NaN values aren't set (#7116)
			if ( value == null || value !== value ) {
				return;
			}

			// If a number was passed in, add the unit (except for certain CSS properties)
			if ( type === "number" ) {
				value += ret && ret[ 3 ] || ( jQuery.cssNumber[ origName ] ? "" : "px" );
			}

			// background-* props affect original clone's values
			if ( !support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0 ) {
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !( "set" in hooks ) ||
				( value = hooks.set( elem, value, extra ) ) !== undefined ) {

				if ( isCustomProp ) {
					style.setProperty( name, value );
				} else {
					style[ name ] = value;
				}
			}

		} else {

			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks &&
				( ret = hooks.get( elem, false, extra ) ) !== undefined ) {

				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra, styles ) {
		var val, num, hooks,
			origName = camelCase( name ),
			isCustomProp = rcustomProp.test( name );

		// Make sure that we're working with the right name. We don't
		// want to modify the value if it is a CSS custom property
		// since they are user-defined.
		if ( !isCustomProp ) {
			name = finalPropName( origName );
		}

		// Try prefixed name followed by the unprefixed name
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name, styles );
		}

		// Convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Make numeric if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {
			num = parseFloat( val );
			return extra === true || isFinite( num ) ? num || 0 : val;
		}

		return val;
	}
} );

jQuery.each( [ "height", "width" ], function( i, dimension ) {
	jQuery.cssHooks[ dimension ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {

				// Certain elements can have dimension info if we invisibly show them
				// but it must have a current display style that would benefit
				return rdisplayswap.test( jQuery.css( elem, "display" ) ) &&

					// Support: Safari 8+
					// Table columns in Safari have non-zero offsetWidth & zero
					// getBoundingClientRect().width unless display is changed.
					// Support: IE <=11 only
					// Running getBoundingClientRect on a disconnected node
					// in IE throws an error.
					( !elem.getClientRects().length || !elem.getBoundingClientRect().width ) ?
						swap( elem, cssShow, function() {
							return getWidthOrHeight( elem, dimension, extra );
						} ) :
						getWidthOrHeight( elem, dimension, extra );
			}
		},

		set: function( elem, value, extra ) {
			var matches,
				styles = getStyles( elem ),
				isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
				subtract = extra && boxModelAdjustment(
					elem,
					dimension,
					extra,
					isBorderBox,
					styles
				);

			// Account for unreliable border-box dimensions by comparing offset* to computed and
			// faking a content-box to get border and padding (gh-3699)
			if ( isBorderBox && support.scrollboxSize() === styles.position ) {
				subtract -= Math.ceil(
					elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ] -
					parseFloat( styles[ dimension ] ) -
					boxModelAdjustment( elem, dimension, "border", false, styles ) -
					0.5
				);
			}

			// Convert to pixels if value adjustment is needed
			if ( subtract && ( matches = rcssNum.exec( value ) ) &&
				( matches[ 3 ] || "px" ) !== "px" ) {

				elem.style[ dimension ] = value;
				value = jQuery.css( elem, dimension );
			}

			return setPositiveNumber( elem, value, subtract );
		}
	};
} );

jQuery.cssHooks.marginLeft = addGetHookIf( support.reliableMarginLeft,
	function( elem, computed ) {
		if ( computed ) {
			return ( parseFloat( curCSS( elem, "marginLeft" ) ) ||
				elem.getBoundingClientRect().left -
					swap( elem, { marginLeft: 0 }, function() {
						return elem.getBoundingClientRect().left;
					} )
				) + "px";
		}
	}
);

// These hooks are used by animate to expand properties
jQuery.each( {
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i = 0,
				expanded = {},

				// Assumes a single number if not a string
				parts = typeof value === "string" ? value.split( " " ) : [ value ];

			for ( ; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( prefix !== "margin" ) {
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
} );

jQuery.fn.extend( {
	css: function( name, value ) {
		return access( this, function( elem, name, value ) {
			var styles, len,
				map = {},
				i = 0;

			if ( Array.isArray( name ) ) {
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	}
} );


function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || jQuery.easing._default;
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			// Use a property on the element directly when it is not a DOM element,
			// or when there is no matching style property that exists.
			if ( tween.elem.nodeType !== 1 ||
				tween.elem[ tween.prop ] != null && tween.elem.style[ tween.prop ] == null ) {
				return tween.elem[ tween.prop ];
			}

			// Passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails.
			// Simple values such as "10px" are parsed to Float;
			// complex values such as "rotate(1rad)" are returned as-is.
			result = jQuery.css( tween.elem, tween.prop, "" );

			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {

			// Use step hook for back compat.
			// Use cssHook if its there.
			// Use .style if available and use plain properties where available.
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.nodeType === 1 &&
				( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null ||
					jQuery.cssHooks[ tween.prop ] ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Support: IE <=9 only
// Panic based approach to setting things on disconnected nodes
Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p * Math.PI ) / 2;
	},
	_default: "swing"
};

jQuery.fx = Tween.prototype.init;

// Back compat <1.8 extension point
jQuery.fx.step = {};




var
	fxNow, inProgress,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rrun = /queueHooks$/;

function schedule() {
	if ( inProgress ) {
		if ( document.hidden === false && window.requestAnimationFrame ) {
			window.requestAnimationFrame( schedule );
		} else {
			window.setTimeout( schedule, jQuery.fx.interval );
		}

		jQuery.fx.tick();
	}
}

// Animations created synchronously will run synchronously
function createFxNow() {
	window.setTimeout( function() {
		fxNow = undefined;
	} );
	return ( fxNow = Date.now() );
}

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		i = 0,
		attrs = { height: type };

	// If we include width, step value is 1 to do all cssExpand values,
	// otherwise step value is 2 to skip over Left and Right
	includeWidth = includeWidth ? 1 : 0;
	for ( ; i < 4; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

function createTween( value, prop, animation ) {
	var tween,
		collection = ( Animation.tweeners[ prop ] || [] ).concat( Animation.tweeners[ "*" ] ),
		index = 0,
		length = collection.length;
	for ( ; index < length; index++ ) {
		if ( ( tween = collection[ index ].call( animation, prop, value ) ) ) {

			// We're done with this property
			return tween;
		}
	}
}

function defaultPrefilter( elem, props, opts ) {
	var prop, value, toggle, hooks, oldfire, propTween, restoreDisplay, display,
		isBox = "width" in props || "height" in props,
		anim = this,
		orig = {},
		style = elem.style,
		hidden = elem.nodeType && isHiddenWithinTree( elem ),
		dataShow = dataPriv.get( elem, "fxshow" );

	// Queue-skipping animations hijack the fx hooks
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always( function() {

			// Ensure the complete handler is called before this completes
			anim.always( function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			} );
		} );
	}

	// Detect show/hide animations
	for ( prop in props ) {
		value = props[ prop ];
		if ( rfxtypes.test( value ) ) {
			delete props[ prop ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {

				// Pretend to be hidden if this is a "show" and
				// there is still data from a stopped show/hide
				if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
					hidden = true;

				// Ignore all other no-op show/hide data
				} else {
					continue;
				}
			}
			orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );
		}
	}

	// Bail out if this is a no-op like .hide().hide()
	propTween = !jQuery.isEmptyObject( props );
	if ( !propTween && jQuery.isEmptyObject( orig ) ) {
		return;
	}

	// Restrict "overflow" and "display" styles during box animations
	if ( isBox && elem.nodeType === 1 ) {

		// Support: IE <=9 - 11, Edge 12 - 15
		// Record all 3 overflow attributes because IE does not infer the shorthand
		// from identically-valued overflowX and overflowY and Edge just mirrors
		// the overflowX value there.
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Identify a display type, preferring old show/hide data over the CSS cascade
		restoreDisplay = dataShow && dataShow.display;
		if ( restoreDisplay == null ) {
			restoreDisplay = dataPriv.get( elem, "display" );
		}
		display = jQuery.css( elem, "display" );
		if ( display === "none" ) {
			if ( restoreDisplay ) {
				display = restoreDisplay;
			} else {

				// Get nonempty value(s) by temporarily forcing visibility
				showHide( [ elem ], true );
				restoreDisplay = elem.style.display || restoreDisplay;
				display = jQuery.css( elem, "display" );
				showHide( [ elem ] );
			}
		}

		// Animate inline elements as inline-block
		if ( display === "inline" || display === "inline-block" && restoreDisplay != null ) {
			if ( jQuery.css( elem, "float" ) === "none" ) {

				// Restore the original display value at the end of pure show/hide animations
				if ( !propTween ) {
					anim.done( function() {
						style.display = restoreDisplay;
					} );
					if ( restoreDisplay == null ) {
						display = style.display;
						restoreDisplay = display === "none" ? "" : display;
					}
				}
				style.display = "inline-block";
			}
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		anim.always( function() {
			style.overflow = opts.overflow[ 0 ];
			style.overflowX = opts.overflow[ 1 ];
			style.overflowY = opts.overflow[ 2 ];
		} );
	}

	// Implement show/hide animations
	propTween = false;
	for ( prop in orig ) {

		// General show/hide setup for this element animation
		if ( !propTween ) {
			if ( dataShow ) {
				if ( "hidden" in dataShow ) {
					hidden = dataShow.hidden;
				}
			} else {
				dataShow = dataPriv.access( elem, "fxshow", { display: restoreDisplay } );
			}

			// Store hidden/visible for toggle so `.stop().toggle()` "reverses"
			if ( toggle ) {
				dataShow.hidden = !hidden;
			}

			// Show elements before animating them
			if ( hidden ) {
				showHide( [ elem ], true );
			}

			/* eslint-disable no-loop-func */

			anim.done( function() {

			/* eslint-enable no-loop-func */

				// The final step of a "hide" animation is actually hiding the element
				if ( !hidden ) {
					showHide( [ elem ] );
				}
				dataPriv.remove( elem, "fxshow" );
				for ( prop in orig ) {
					jQuery.style( elem, prop, orig[ prop ] );
				}
			} );
		}

		// Per-property setup
		propTween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );
		if ( !( prop in dataShow ) ) {
			dataShow[ prop ] = propTween.start;
			if ( hidden ) {
				propTween.end = propTween.start;
				propTween.start = 0;
			}
		}
	}
}

function propFilter( props, specialEasing ) {
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( Array.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// Not quite $.extend, this won't overwrite existing keys.
			// Reusing 'index' because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

function Animation( elem, properties, options ) {
	var result,
		stopped,
		index = 0,
		length = Animation.prefilters.length,
		deferred = jQuery.Deferred().always( function() {

			// Don't match elem in the :animated selector
			delete tick.elem;
		} ),
		tick = function() {
			if ( stopped ) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),

				// Support: Android 2.3 only
				// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ] );

			// If there's more to do, yield
			if ( percent < 1 && length ) {
				return remaining;
			}

			// If this was an empty animation, synthesize a final progress notification
			if ( !length ) {
				deferred.notifyWith( elem, [ animation, 1, 0 ] );
			}

			// Resolve the animation and report its conclusion
			deferred.resolveWith( elem, [ animation ] );
			return false;
		},
		animation = deferred.promise( {
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, {
				specialEasing: {},
				easing: jQuery.easing._default
			}, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,

					// If we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {
					return this;
				}
				stopped = true;
				for ( ; index < length; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// Resolve when we played the last frame; otherwise, reject
				if ( gotoEnd ) {
					deferred.notifyWith( elem, [ animation, 1, 0 ] );
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		} ),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length; index++ ) {
		result = Animation.prefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			if ( isFunction( result.stop ) ) {
				jQuery._queueHooks( animation.elem, animation.opts.queue ).stop =
					result.stop.bind( result );
			}
			return result;
		}
	}

	jQuery.map( props, createTween, animation );

	if ( isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	// Attach callbacks from options
	animation
		.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		} )
	);

	return animation;
}

jQuery.Animation = jQuery.extend( Animation, {

	tweeners: {
		"*": [ function( prop, value ) {
			var tween = this.createTween( prop, value );
			adjustCSS( tween.elem, prop, rcssNum.exec( value ), tween );
			return tween;
		} ]
	},

	tweener: function( props, callback ) {
		if ( isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.match( rnothtmlwhite );
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length; index++ ) {
			prop = props[ index ];
			Animation.tweeners[ prop ] = Animation.tweeners[ prop ] || [];
			Animation.tweeners[ prop ].unshift( callback );
		}
	},

	prefilters: [ defaultPrefilter ],

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			Animation.prefilters.unshift( callback );
		} else {
			Animation.prefilters.push( callback );
		}
	}
} );

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !isFunction( easing ) && easing
	};

	// Go to the end state if fx are off
	if ( jQuery.fx.off ) {
		opt.duration = 0;

	} else {
		if ( typeof opt.duration !== "number" ) {
			if ( opt.duration in jQuery.fx.speeds ) {
				opt.duration = jQuery.fx.speeds[ opt.duration ];

			} else {
				opt.duration = jQuery.fx.speeds._default;
			}
		}
	}

	// Normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.fn.extend( {
	fadeTo: function( speed, to, easing, callback ) {

		// Show any hidden elements after setting opacity to 0
		return this.filter( isHiddenWithinTree ).css( "opacity", 0 ).show()

			// Animate to the value specified
			.end().animate( { opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {

				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

				// Empty animations, or finishing resolves immediately
				if ( empty || dataPriv.get( this, "finish" ) ) {
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each( function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = dataPriv.get( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this &&
					( type == null || timers[ index ].queue === type ) ) {

					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// Start the next in the queue if the last step wasn't forced.
			// Timers currently will call their complete callbacks, which
			// will dequeue but only if they were gotoEnd.
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		} );
	},
	finish: function( type ) {
		if ( type !== false ) {
			type = type || "fx";
		}
		return this.each( function() {
			var index,
				data = dataPriv.get( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// Enable finishing flag on private data
			data.finish = true;

			// Empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.stop ) {
				hooks.stop.call( this, true );
			}

			// Look for any active animations, and finish them
			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// Look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {
				if ( queue[ index ] && queue[ index ].finish ) {
					queue[ index ].finish.call( this );
				}
			}

			// Turn off finishing flag
			delete data.finish;
		} );
	}
} );

jQuery.each( [ "toggle", "show", "hide" ], function( i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
} );

// Generate shortcuts for custom animations
jQuery.each( {
	slideDown: genFx( "show" ),
	slideUp: genFx( "hide" ),
	slideToggle: genFx( "toggle" ),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
} );

jQuery.timers = [];
jQuery.fx.tick = function() {
	var timer,
		i = 0,
		timers = jQuery.timers;

	fxNow = Date.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];

		// Run the timer and safely remove it when done (allowing for external removal)
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	jQuery.timers.push( timer );
	jQuery.fx.start();
};

jQuery.fx.interval = 13;
jQuery.fx.start = function() {
	if ( inProgress ) {
		return;
	}

	inProgress = true;
	schedule();
};

jQuery.fx.stop = function() {
	inProgress = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,

	// Default speed
	_default: 400
};


// Based off of the plugin by Clint Helfers, with permission.
// https://web.archive.org/web/20100324014747/http://blindsignals.com/index.php/2009/07/jquery-delay/
jQuery.fn.delay = function( time, type ) {
	time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
	type = type || "fx";

	return this.queue( type, function( next, hooks ) {
		var timeout = window.setTimeout( next, time );
		hooks.stop = function() {
			window.clearTimeout( timeout );
		};
	} );
};


( function() {
	var input = document.createElement( "input" ),
		select = document.createElement( "select" ),
		opt = select.appendChild( document.createElement( "option" ) );

	input.type = "checkbox";

	// Support: Android <=4.3 only
	// Default value for a checkbox should be "on"
	support.checkOn = input.value !== "";

	// Support: IE <=11 only
	// Must access selectedIndex to make default options select
	support.optSelected = opt.selected;

	// Support: IE <=11 only
	// An input loses its value after becoming a radio
	input = document.createElement( "input" );
	input.value = "t";
	input.type = "radio";
	support.radioValue = input.value === "t";
} )();


var boolHook,
	attrHandle = jQuery.expr.attrHandle;

jQuery.fn.extend( {
	attr: function( name, value ) {
		return access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each( function() {
			jQuery.removeAttr( this, name );
		} );
	}
} );

jQuery.extend( {
	attr: function( elem, name, value ) {
		var ret, hooks,
			nType = elem.nodeType;

		// Don't get/set attributes on text, comment and attribute nodes
		if ( nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === "undefined" ) {
			return jQuery.prop( elem, name, value );
		}

		// Attribute hooks are determined by the lowercase version
		// Grab necessary hook if one is defined
		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
			hooks = jQuery.attrHooks[ name.toLowerCase() ] ||
				( jQuery.expr.match.bool.test( name ) ? boolHook : undefined );
		}

		if ( value !== undefined ) {
			if ( value === null ) {
				jQuery.removeAttr( elem, name );
				return;
			}

			if ( hooks && "set" in hooks &&
				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
				return ret;
			}

			elem.setAttribute( name, value + "" );
			return value;
		}

		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
			return ret;
		}

		ret = jQuery.find.attr( elem, name );

		// Non-existent attributes return null, we normalize to undefined
		return ret == null ? undefined : ret;
	},

	attrHooks: {
		type: {
			set: function( elem, value ) {
				if ( !support.radioValue && value === "radio" &&
					nodeName( elem, "input" ) ) {
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		}
	},

	removeAttr: function( elem, value ) {
		var name,
			i = 0,

			// Attribute names can contain non-HTML whitespace characters
			// https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
			attrNames = value && value.match( rnothtmlwhite );

		if ( attrNames && elem.nodeType === 1 ) {
			while ( ( name = attrNames[ i++ ] ) ) {
				elem.removeAttribute( name );
			}
		}
	}
} );

// Hooks for boolean attributes
boolHook = {
	set: function( elem, value, name ) {
		if ( value === false ) {

			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else {
			elem.setAttribute( name, name );
		}
		return name;
	}
};

jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {
	var getter = attrHandle[ name ] || jQuery.find.attr;

	attrHandle[ name ] = function( elem, name, isXML ) {
		var ret, handle,
			lowercaseName = name.toLowerCase();

		if ( !isXML ) {

			// Avoid an infinite loop by temporarily removing this function from the getter
			handle = attrHandle[ lowercaseName ];
			attrHandle[ lowercaseName ] = ret;
			ret = getter( elem, name, isXML ) != null ?
				lowercaseName :
				null;
			attrHandle[ lowercaseName ] = handle;
		}
		return ret;
	};
} );




var rfocusable = /^(?:input|select|textarea|button)$/i,
	rclickable = /^(?:a|area)$/i;

jQuery.fn.extend( {
	prop: function( name, value ) {
		return access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		return this.each( function() {
			delete this[ jQuery.propFix[ name ] || name ];
		} );
	}
} );

jQuery.extend( {
	prop: function( elem, name, value ) {
		var ret, hooks,
			nType = elem.nodeType;

		// Don't get/set properties on text, comment and attribute nodes
		if ( nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {

			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			if ( hooks && "set" in hooks &&
				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
				return ret;
			}

			return ( elem[ name ] = value );
		}

		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
			return ret;
		}

		return elem[ name ];
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {

				// Support: IE <=9 - 11 only
				// elem.tabIndex doesn't always return the
				// correct value when it hasn't been explicitly set
				// https://web.archive.org/web/20141116233347/http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
				// Use proper attribute retrieval(#12072)
				var tabindex = jQuery.find.attr( elem, "tabindex" );

				if ( tabindex ) {
					return parseInt( tabindex, 10 );
				}

				if (
					rfocusable.test( elem.nodeName ) ||
					rclickable.test( elem.nodeName ) &&
					elem.href
				) {
					return 0;
				}

				return -1;
			}
		}
	},

	propFix: {
		"for": "htmlFor",
		"class": "className"
	}
} );

// Support: IE <=11 only
// Accessing the selectedIndex property
// forces the browser to respect setting selected
// on the option
// The getter ensures a default option is selected
// when in an optgroup
// eslint rule "no-unused-expressions" is disabled for this code
// since it considers such accessions noop
if ( !support.optSelected ) {
	jQuery.propHooks.selected = {
		get: function( elem ) {

			/* eslint no-unused-expressions: "off" */

			var parent = elem.parentNode;
			if ( parent && parent.parentNode ) {
				parent.parentNode.selectedIndex;
			}
			return null;
		},
		set: function( elem ) {

			/* eslint no-unused-expressions: "off" */

			var parent = elem.parentNode;
			if ( parent ) {
				parent.selectedIndex;

				if ( parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
			}
		}
	};
}

jQuery.each( [
	"tabIndex",
	"readOnly",
	"maxLength",
	"cellSpacing",
	"cellPadding",
	"rowSpan",
	"colSpan",
	"useMap",
	"frameBorder",
	"contentEditable"
], function() {
	jQuery.propFix[ this.toLowerCase() ] = this;
} );




	// Strip and collapse whitespace according to HTML spec
	// https://infra.spec.whatwg.org/#strip-and-collapse-ascii-whitespace
	function stripAndCollapse( value ) {
		var tokens = value.match( rnothtmlwhite ) || [];
		return tokens.join( " " );
	}


function getClass( elem ) {
	return elem.getAttribute && elem.getAttribute( "class" ) || "";
}

function classesToArray( value ) {
	if ( Array.isArray( value ) ) {
		return value;
	}
	if ( typeof value === "string" ) {
		return value.match( rnothtmlwhite ) || [];
	}
	return [];
}

jQuery.fn.extend( {
	addClass: function( value ) {
		var classes, elem, cur, curValue, clazz, j, finalValue,
			i = 0;

		if ( isFunction( value ) ) {
			return this.each( function( j ) {
				jQuery( this ).addClass( value.call( this, j, getClass( this ) ) );
			} );
		}

		classes = classesToArray( value );

		if ( classes.length ) {
			while ( ( elem = this[ i++ ] ) ) {
				curValue = getClass( elem );
				cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

				if ( cur ) {
					j = 0;
					while ( ( clazz = classes[ j++ ] ) ) {
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = stripAndCollapse( cur );
					if ( curValue !== finalValue ) {
						elem.setAttribute( "class", finalValue );
					}
				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var classes, elem, cur, curValue, clazz, j, finalValue,
			i = 0;

		if ( isFunction( value ) ) {
			return this.each( function( j ) {
				jQuery( this ).removeClass( value.call( this, j, getClass( this ) ) );
			} );
		}

		if ( !arguments.length ) {
			return this.attr( "class", "" );
		}

		classes = classesToArray( value );

		if ( classes.length ) {
			while ( ( elem = this[ i++ ] ) ) {
				curValue = getClass( elem );

				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

				if ( cur ) {
					j = 0;
					while ( ( clazz = classes[ j++ ] ) ) {

						// Remove *all* instances
						while ( cur.indexOf( " " + clazz + " " ) > -1 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = stripAndCollapse( cur );
					if ( curValue !== finalValue ) {
						elem.setAttribute( "class", finalValue );
					}
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value,
			isValidValue = type === "string" || Array.isArray( value );

		if ( typeof stateVal === "boolean" && isValidValue ) {
			return stateVal ? this.addClass( value ) : this.removeClass( value );
		}

		if ( isFunction( value ) ) {
			return this.each( function( i ) {
				jQuery( this ).toggleClass(
					value.call( this, i, getClass( this ), stateVal ),
					stateVal
				);
			} );
		}

		return this.each( function() {
			var className, i, self, classNames;

			if ( isValidValue ) {

				// Toggle individual class names
				i = 0;
				self = jQuery( this );
				classNames = classesToArray( value );

				while ( ( className = classNames[ i++ ] ) ) {

					// Check each className given, space separated list
					if ( self.hasClass( className ) ) {
						self.removeClass( className );
					} else {
						self.addClass( className );
					}
				}

			// Toggle whole class name
			} else if ( value === undefined || type === "boolean" ) {
				className = getClass( this );
				if ( className ) {

					// Store className if set
					dataPriv.set( this, "__className__", className );
				}

				// If the element has a class name or if we're passed `false`,
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
				if ( this.setAttribute ) {
					this.setAttribute( "class",
						className || value === false ?
						"" :
						dataPriv.get( this, "__className__" ) || ""
					);
				}
			}
		} );
	},

	hasClass: function( selector ) {
		var className, elem,
			i = 0;

		className = " " + selector + " ";
		while ( ( elem = this[ i++ ] ) ) {
			if ( elem.nodeType === 1 &&
				( " " + stripAndCollapse( getClass( elem ) ) + " " ).indexOf( className ) > -1 ) {
					return true;
			}
		}

		return false;
	}
} );




var rreturn = /\r/g;

jQuery.fn.extend( {
	val: function( value ) {
		var hooks, ret, valueIsFunction,
			elem = this[ 0 ];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.type ] ||
					jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if ( hooks &&
					"get" in hooks &&
					( ret = hooks.get( elem, "value" ) ) !== undefined
				) {
					return ret;
				}

				ret = elem.value;

				// Handle most common string cases
				if ( typeof ret === "string" ) {
					return ret.replace( rreturn, "" );
				}

				// Handle cases where value is null/undef or number
				return ret == null ? "" : ret;
			}

			return;
		}

		valueIsFunction = isFunction( value );

		return this.each( function( i ) {
			var val;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( valueIsFunction ) {
				val = value.call( this, i, jQuery( this ).val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";

			} else if ( typeof val === "number" ) {
				val += "";

			} else if ( Array.isArray( val ) ) {
				val = jQuery.map( val, function( value ) {
					return value == null ? "" : value + "";
				} );
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !( "set" in hooks ) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		} );
	}
} );

jQuery.extend( {
	valHooks: {
		option: {
			get: function( elem ) {

				var val = jQuery.find.attr( elem, "value" );
				return val != null ?
					val :

					// Support: IE <=10 - 11 only
					// option.text throws exceptions (#14686, #14858)
					// Strip and collapse whitespace
					// https://html.spec.whatwg.org/#strip-and-collapse-whitespace
					stripAndCollapse( jQuery.text( elem ) );
			}
		},
		select: {
			get: function( elem ) {
				var value, option, i,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one",
					values = one ? null : [],
					max = one ? index + 1 : options.length;

				if ( index < 0 ) {
					i = max;

				} else {
					i = one ? index : 0;
				}

				// Loop through all the selected options
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// Support: IE <=9 only
					// IE8-9 doesn't update selected after form reset (#2551)
					if ( ( option.selected || i === index ) &&

							// Don't return options that are disabled or in a disabled optgroup
							!option.disabled &&
							( !option.parentNode.disabled ||
								!nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray( value ),
					i = options.length;

				while ( i-- ) {
					option = options[ i ];

					/* eslint-disable no-cond-assign */

					if ( option.selected =
						jQuery.inArray( jQuery.valHooks.option.get( option ), values ) > -1
					) {
						optionSet = true;
					}

					/* eslint-enable no-cond-assign */
				}

				// Force browsers to behave consistently when non-matching value is set
				if ( !optionSet ) {
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	}
} );

// Radios and checkboxes getter/setter
jQuery.each( [ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = {
		set: function( elem, value ) {
			if ( Array.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery( elem ).val(), value ) > -1 );
			}
		}
	};
	if ( !support.checkOn ) {
		jQuery.valHooks[ this ].get = function( elem ) {
			return elem.getAttribute( "value" ) === null ? "on" : elem.value;
		};
	}
} );




// Return jQuery for attributes-only inclusion


support.focusin = "onfocusin" in window;


var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	stopPropagationCallback = function( e ) {
		e.stopPropagation();
	};

jQuery.extend( jQuery.event, {

	trigger: function( event, data, elem, onlyHandlers ) {

		var i, cur, tmp, bubbleType, ontype, handle, special, lastElement,
			eventPath = [ elem || document ],
			type = hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split( "." ) : [];

		cur = lastElement = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf( "." ) > -1 ) {

			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split( "." );
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf( ":" ) < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join( "." );
		event.rnamespace = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === ( elem.ownerDocument || document ) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( ( cur = eventPath[ i++ ] ) && !event.isPropagationStopped() ) {
			lastElement = cur;
			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = ( dataPriv.get( cur, "events" ) || {} )[ event.type ] &&
				dataPriv.get( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && handle.apply && acceptData( cur ) ) {
				event.result = handle.apply( cur, data );
				if ( event.result === false ) {
					event.preventDefault();
				}
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( ( !special._default ||
				special._default.apply( eventPath.pop(), data ) === false ) &&
				acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name as the event.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && isFunction( elem[ type ] ) && !isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;

					if ( event.isPropagationStopped() ) {
						lastElement.addEventListener( type, stopPropagationCallback );
					}

					elem[ type ]();

					if ( event.isPropagationStopped() ) {
						lastElement.removeEventListener( type, stopPropagationCallback );
					}

					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	// Piggyback on a donor event to simulate a different one
	// Used only for `focus(in | out)` events
	simulate: function( type, elem, event ) {
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true
			}
		);

		jQuery.event.trigger( e, null, elem );
	}

} );

jQuery.fn.extend( {

	trigger: function( type, data ) {
		return this.each( function() {
			jQuery.event.trigger( type, data, this );
		} );
	},
	triggerHandler: function( type, data ) {
		var elem = this[ 0 ];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
} );


// Support: Firefox <=44
// Firefox doesn't have focus(in | out) events
// Related ticket - https://bugzilla.mozilla.org/show_bug.cgi?id=687787
//
// Support: Chrome <=48 - 49, Safari <=9.0 - 9.1
// focus(in | out) events fire after focus & blur events,
// which is spec violation - http://www.w3.org/TR/DOM-Level-3-Events/#events-focusevent-event-order
// Related ticket - https://bugs.chromium.org/p/chromium/issues/detail?id=449857
if ( !support.focusin ) {
	jQuery.each( { focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler on the document while someone wants focusin/focusout
		var handler = function( event ) {
			jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ) );
		};

		jQuery.event.special[ fix ] = {
			setup: function() {
				var doc = this.ownerDocument || this,
					attaches = dataPriv.access( doc, fix );

				if ( !attaches ) {
					doc.addEventListener( orig, handler, true );
				}
				dataPriv.access( doc, fix, ( attaches || 0 ) + 1 );
			},
			teardown: function() {
				var doc = this.ownerDocument || this,
					attaches = dataPriv.access( doc, fix ) - 1;

				if ( !attaches ) {
					doc.removeEventListener( orig, handler, true );
					dataPriv.remove( doc, fix );

				} else {
					dataPriv.access( doc, fix, attaches );
				}
			}
		};
	} );
}
var location = window.location;

var nonce = Date.now();

var rquery = ( /\?/ );



// Cross-browser xml parsing
jQuery.parseXML = function( data ) {
	var xml;
	if ( !data || typeof data !== "string" ) {
		return null;
	}

	// Support: IE 9 - 11 only
	// IE throws on parseFromString with invalid input.
	try {
		xml = ( new window.DOMParser() ).parseFromString( data, "text/xml" );
	} catch ( e ) {
		xml = undefined;
	}

	if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
		jQuery.error( "Invalid XML: " + data );
	}
	return xml;
};


var
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

function buildParams( prefix, obj, traditional, add ) {
	var name;

	if ( Array.isArray( obj ) ) {

		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {

				// Treat each array item as a scalar.
				add( prefix, v );

			} else {

				// Item is non-scalar (array or object), encode its numeric index.
				buildParams(
					prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]",
					v,
					traditional,
					add
				);
			}
		} );

	} else if ( !traditional && toType( obj ) === "object" ) {

		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {

		// Serialize scalar item.
		add( prefix, obj );
	}
}

// Serialize an array of form elements or a set of
// key/values into a query string
jQuery.param = function( a, traditional ) {
	var prefix,
		s = [],
		add = function( key, valueOrFunction ) {

			// If value is a function, invoke it and use its return value
			var value = isFunction( valueOrFunction ) ?
				valueOrFunction() :
				valueOrFunction;

			s[ s.length ] = encodeURIComponent( key ) + "=" +
				encodeURIComponent( value == null ? "" : value );
		};

	// If an array was passed in, assume that it is an array of form elements.
	if ( Array.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {

		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		} );

	} else {

		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" );
};

jQuery.fn.extend( {
	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function() {
		return this.map( function() {

			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		} )
		.filter( function() {
			var type = this.type;

			// Use .is( ":disabled" ) so that fieldset[disabled] works
			return this.name && !jQuery( this ).is( ":disabled" ) &&
				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
				( this.checked || !rcheckableType.test( type ) );
		} )
		.map( function( i, elem ) {
			var val = jQuery( this ).val();

			if ( val == null ) {
				return null;
			}

			if ( Array.isArray( val ) ) {
				return jQuery.map( val, function( val ) {
					return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
				} );
			}

			return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		} ).get();
	}
} );


var
	r20 = /%20/g,
	rhash = /#.*$/,
	rantiCache = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,

	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat( "*" ),

	// Anchor tag for parsing the document origin
	originAnchor = document.createElement( "a" );
	originAnchor.href = location.href;

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( rnothtmlwhite ) || [];

		if ( isFunction( func ) ) {

			// For each dataType in the dataTypeExpression
			while ( ( dataType = dataTypes[ i++ ] ) ) {

				// Prepend if requested
				if ( dataType[ 0 ] === "+" ) {
					dataType = dataType.slice( 1 ) || "*";
					( structure[ dataType ] = structure[ dataType ] || [] ).unshift( func );

				// Otherwise append
				} else {
					( structure[ dataType ] = structure[ dataType ] || [] ).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if ( typeof dataTypeOrTransport === "string" &&
				!seekingTransport && !inspected[ dataTypeOrTransport ] ) {

				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {
				return !( selected = dataTypeOrTransport );
			}
		} );
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var key, deep,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}

	return target;
}

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {

	var ct, type, finalDataType, firstDataType,
		contents = s.contents,
		dataTypes = s.dataTypes;

	// Remove auto dataType and get content-type in the process
	while ( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader( "Content-Type" );
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {

		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[ 0 ] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}

		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {
	var conv2, current, conv, tmp, prev,
		converters = {},

		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while ( current ) {

		if ( s.responseFields[ current ] ) {
			jqXHR[ s.responseFields[ current ] ] = response;
		}

		// Apply the dataFilter if provided
		if ( !prev && isSuccess && s.dataFilter ) {
			response = s.dataFilter( response, s.dataType );
		}

		prev = current;
		current = dataTypes.shift();

		if ( current ) {

			// There's only work to do if current dataType is non-auto
			if ( current === "*" ) {

				current = prev;

			// Convert response if prev dataType is non-auto and differs from current
			} else if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split( " " );
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {

								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.unshift( tmp[ 1 ] );
								}
								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s.throws ) {
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return {
								state: "parsererror",
								error: conv ? e : "No conversion from " + prev + " to " + current
							};
						}
					}
				}
			}
		}
	}

	return { state: "success", data: response };
}

jQuery.extend( {

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: location.href,
		type: "GET",
		isLocal: rlocalProtocol.test( location.protocol ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",

		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /\bxml\b/,
			html: /\bhtml/,
			json: /\bjson\b/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": JSON.parse,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var transport,

			// URL without anti-cache param
			cacheURL,

			// Response headers
			responseHeadersString,
			responseHeaders,

			// timeout handle
			timeoutTimer,

			// Url cleanup var
			urlAnchor,

			// Request state (becomes false upon send and true upon completion)
			completed,

			// To know if global events are to be dispatched
			fireGlobals,

			// Loop variable
			i,

			// uncached part of the url
			uncached,

			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),

			// Callbacks context
			callbackContext = s.context || s,

			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context &&
				( callbackContext.nodeType || callbackContext.jquery ) ?
					jQuery( callbackContext ) :
					jQuery.event,

			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks( "once memory" ),

			// Status-dependent callbacks
			statusCode = s.statusCode || {},

			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},

			// Default abort message
			strAbort = "canceled",

			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( completed ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while ( ( match = rheaders.exec( responseHeadersString ) ) ) {
								responseHeaders[ match[ 1 ].toLowerCase() ] = match[ 2 ];
							}
						}
						match = responseHeaders[ key.toLowerCase() ];
					}
					return match == null ? null : match;
				},

				// Raw string
				getAllResponseHeaders: function() {
					return completed ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function( name, value ) {
					if ( completed == null ) {
						name = requestHeadersNames[ name.toLowerCase() ] =
							requestHeadersNames[ name.toLowerCase() ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( completed == null ) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function( map ) {
					var code;
					if ( map ) {
						if ( completed ) {

							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						} else {

							// Lazy-add the new callbacks in a way that preserves old ones
							for ( code in map ) {
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						}
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					var finalText = statusText || strAbort;
					if ( transport ) {
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR );

		// Add protocol if not provided (prefilters might expect it)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || location.href ) + "" )
			.replace( rprotocol, location.protocol + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = ( s.dataType || "*" ).toLowerCase().match( rnothtmlwhite ) || [ "" ];

		// A cross-domain request is in order when the origin doesn't match the current origin.
		if ( s.crossDomain == null ) {
			urlAnchor = document.createElement( "a" );

			// Support: IE <=8 - 11, Edge 12 - 15
			// IE throws exception on accessing the href property if url is malformed,
			// e.g. http://example.com:80x/
			try {
				urlAnchor.href = s.url;

				// Support: IE <=8 - 11 only
				// Anchor's host property isn't correctly set when s.url is relative
				urlAnchor.href = urlAnchor.href;
				s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !==
					urlAnchor.protocol + "//" + urlAnchor.host;
			} catch ( e ) {

				// If there is an error parsing the URL, assume it is crossDomain,
				// it can be rejected by the transport if it is invalid
				s.crossDomain = true;
			}
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( completed ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
		fireGlobals = jQuery.event && s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger( "ajaxStart" );
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		// Remove hash to simplify url manipulation
		cacheURL = s.url.replace( rhash, "" );

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// Remember the hash so we can put it back
			uncached = s.url.slice( cacheURL.length );

			// If data is available and should be processed, append data to url
			if ( s.data && ( s.processData || typeof s.data === "string" ) ) {
				cacheURL += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data;

				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add or update anti-cache param if needed
			if ( s.cache === false ) {
				cacheURL = cacheURL.replace( rantiCache, "$1" );
				uncached = ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + ( nonce++ ) + uncached;
			}

			// Put hash and anti-cache on the URL that will be requested (gh-1732)
			s.url = cacheURL + uncached;

		// Change '%20' to '+' if this is encoded form body content (gh-2658)
		} else if ( s.data && s.processData &&
			( s.contentType || "" ).indexOf( "application/x-www-form-urlencoded" ) === 0 ) {
			s.data = s.data.replace( r20, "+" );
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			if ( jQuery.lastModified[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[ 0 ] ] ?
				s.accepts[ s.dataTypes[ 0 ] ] +
					( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend &&
			( s.beforeSend.call( callbackContext, jqXHR, s ) === false || completed ) ) {

			// Abort if not done already and return
			return jqXHR.abort();
		}

		// Aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		completeDeferred.add( s.complete );
		jqXHR.done( s.success );
		jqXHR.fail( s.error );

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}

			// If request was aborted inside ajaxSend, stop there
			if ( completed ) {
				return jqXHR;
			}

			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = window.setTimeout( function() {
					jqXHR.abort( "timeout" );
				}, s.timeout );
			}

			try {
				completed = false;
				transport.send( requestHeaders, done );
			} catch ( e ) {

				// Rethrow post-completion exceptions
				if ( completed ) {
					throw e;
				}

				// Propagate others as results
				done( -1, e );
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Ignore repeat invocations
			if ( completed ) {
				return;
			}

			completed = true;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				window.clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Determine if successful
			isSuccess = status >= 200 && status < 300 || status === 304;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// Convert no matter what (that way responseXXX fields are always set)
			response = ajaxConvert( s, response, jqXHR, isSuccess );

			// If successful, handle type chaining
			if ( isSuccess ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {
					modified = jqXHR.getResponseHeader( "Last-Modified" );
					if ( modified ) {
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader( "etag" );
					if ( modified ) {
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 || s.type === "HEAD" ) {
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
			} else {

				// Extract error from statusText and normalize for non-aborts
				error = statusText;
				if ( status || !statusText ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );

				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger( "ajaxStop" );
				}
			}
		}

		return jqXHR;
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	},

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	}
} );

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {

		// Shift arguments if data argument was omitted
		if ( isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		// The url can be an options object (which then must have .url)
		return jQuery.ajax( jQuery.extend( {
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		}, jQuery.isPlainObject( url ) && url ) );
	};
} );


jQuery._evalUrl = function( url ) {
	return jQuery.ajax( {
		url: url,

		// Make this explicit, since user can override this through ajaxSetup (#11264)
		type: "GET",
		dataType: "script",
		cache: true,
		async: false,
		global: false,
		"throws": true
	} );
};


jQuery.fn.extend( {
	wrapAll: function( html ) {
		var wrap;

		if ( this[ 0 ] ) {
			if ( isFunction( html ) ) {
				html = html.call( this[ 0 ] );
			}

			// The elements to wrap the target around
			wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

			if ( this[ 0 ].parentNode ) {
				wrap.insertBefore( this[ 0 ] );
			}

			wrap.map( function() {
				var elem = this;

				while ( elem.firstElementChild ) {
					elem = elem.firstElementChild;
				}

				return elem;
			} ).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( isFunction( html ) ) {
			return this.each( function( i ) {
				jQuery( this ).wrapInner( html.call( this, i ) );
			} );
		}

		return this.each( function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		} );
	},

	wrap: function( html ) {
		var htmlIsFunction = isFunction( html );

		return this.each( function( i ) {
			jQuery( this ).wrapAll( htmlIsFunction ? html.call( this, i ) : html );
		} );
	},

	unwrap: function( selector ) {
		this.parent( selector ).not( "body" ).each( function() {
			jQuery( this ).replaceWith( this.childNodes );
		} );
		return this;
	}
} );


jQuery.expr.pseudos.hidden = function( elem ) {
	return !jQuery.expr.pseudos.visible( elem );
};
jQuery.expr.pseudos.visible = function( elem ) {
	return !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );
};




jQuery.ajaxSettings.xhr = function() {
	try {
		return new window.XMLHttpRequest();
	} catch ( e ) {}
};

var xhrSuccessStatus = {

		// File protocol always yields status code 0, assume 200
		0: 200,

		// Support: IE <=9 only
		// #1450: sometimes IE returns 1223 when it should be 204
		1223: 204
	},
	xhrSupported = jQuery.ajaxSettings.xhr();

support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
support.ajax = xhrSupported = !!xhrSupported;

jQuery.ajaxTransport( function( options ) {
	var callback, errorCallback;

	// Cross domain only allowed if supported through XMLHttpRequest
	if ( support.cors || xhrSupported && !options.crossDomain ) {
		return {
			send: function( headers, complete ) {
				var i,
					xhr = options.xhr();

				xhr.open(
					options.type,
					options.url,
					options.async,
					options.username,
					options.password
				);

				// Apply custom fields if provided
				if ( options.xhrFields ) {
					for ( i in options.xhrFields ) {
						xhr[ i ] = options.xhrFields[ i ];
					}
				}

				// Override mime type if needed
				if ( options.mimeType && xhr.overrideMimeType ) {
					xhr.overrideMimeType( options.mimeType );
				}

				// X-Requested-With header
				// For cross-domain requests, seeing as conditions for a preflight are
				// akin to a jigsaw puzzle, we simply never set it to be sure.
				// (it can always be set on a per-request basis or even using ajaxSetup)
				// For same-domain requests, won't change header if already provided.
				if ( !options.crossDomain && !headers[ "X-Requested-With" ] ) {
					headers[ "X-Requested-With" ] = "XMLHttpRequest";
				}

				// Set headers
				for ( i in headers ) {
					xhr.setRequestHeader( i, headers[ i ] );
				}

				// Callback
				callback = function( type ) {
					return function() {
						if ( callback ) {
							callback = errorCallback = xhr.onload =
								xhr.onerror = xhr.onabort = xhr.ontimeout =
									xhr.onreadystatechange = null;

							if ( type === "abort" ) {
								xhr.abort();
							} else if ( type === "error" ) {

								// Support: IE <=9 only
								// On a manual native abort, IE9 throws
								// errors on any property access that is not readyState
								if ( typeof xhr.status !== "number" ) {
									complete( 0, "error" );
								} else {
									complete(

										// File: protocol always yields status 0; see #8605, #14207
										xhr.status,
										xhr.statusText
									);
								}
							} else {
								complete(
									xhrSuccessStatus[ xhr.status ] || xhr.status,
									xhr.statusText,

									// Support: IE <=9 only
									// IE9 has no XHR2 but throws on binary (trac-11426)
									// For XHR2 non-text, let the caller handle it (gh-2498)
									( xhr.responseType || "text" ) !== "text"  ||
									typeof xhr.responseText !== "string" ?
										{ binary: xhr.response } :
										{ text: xhr.responseText },
									xhr.getAllResponseHeaders()
								);
							}
						}
					};
				};

				// Listen to events
				xhr.onload = callback();
				errorCallback = xhr.onerror = xhr.ontimeout = callback( "error" );

				// Support: IE 9 only
				// Use onreadystatechange to replace onabort
				// to handle uncaught aborts
				if ( xhr.onabort !== undefined ) {
					xhr.onabort = errorCallback;
				} else {
					xhr.onreadystatechange = function() {

						// Check readyState before timeout as it changes
						if ( xhr.readyState === 4 ) {

							// Allow onerror to be called first,
							// but that will not handle a native abort
							// Also, save errorCallback to a variable
							// as xhr.onerror cannot be accessed
							window.setTimeout( function() {
								if ( callback ) {
									errorCallback();
								}
							} );
						}
					};
				}

				// Create the abort callback
				callback = callback( "abort" );

				try {

					// Do send the request (this may raise an exception)
					xhr.send( options.hasContent && options.data || null );
				} catch ( e ) {

					// #14683: Only rethrow if this hasn't been notified as an error yet
					if ( callback ) {
						throw e;
					}
				}
			},

			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
} );




// Prevent auto-execution of scripts when no explicit dataType was provided (See gh-2432)
jQuery.ajaxPrefilter( function( s ) {
	if ( s.crossDomain ) {
		s.contents.script = false;
	}
} );

// Install script dataType
jQuery.ajaxSetup( {
	accepts: {
		script: "text/javascript, application/javascript, " +
			"application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /\b(?:java|ecma)script\b/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
} );

// Handle cache's special case and crossDomain
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
	}
} );

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function( s ) {

	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {
		var script, callback;
		return {
			send: function( _, complete ) {
				script = jQuery( "<script>" ).prop( {
					charset: s.scriptCharset,
					src: s.url
				} ).on(
					"load error",
					callback = function( evt ) {
						script.remove();
						callback = null;
						if ( evt ) {
							complete( evt.type === "error" ? 404 : 200, evt.type );
						}
					}
				);

				// Use native DOM manipulation to avoid our domManip AJAX trickery
				document.head.appendChild( script[ 0 ] );
			},
			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
} );




var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup( {
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce++ ) );
		this[ callback ] = true;
		return callback;
	}
} );

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" &&
				( s.contentType || "" )
					.indexOf( "application/x-www-form-urlencoded" ) === 0 &&
				rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {
			s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters[ "script json" ] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// Force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always( function() {

			// If previous value didn't exist - remove it
			if ( overwritten === undefined ) {
				jQuery( window ).removeProp( callbackName );

			// Otherwise restore preexisting value
			} else {
				window[ callbackName ] = overwritten;
			}

			// Save back as free
			if ( s[ callbackName ] ) {

				// Make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// Save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		} );

		// Delegate to script
		return "script";
	}
} );




// Support: Safari 8 only
// In Safari 8 documents created via document.implementation.createHTMLDocument
// collapse sibling forms: the second one becomes a child of the first one.
// Because of that, this security measure has to be disabled in Safari 8.
// https://bugs.webkit.org/show_bug.cgi?id=137337
support.createHTMLDocument = ( function() {
	var body = document.implementation.createHTMLDocument( "" ).body;
	body.innerHTML = "<form></form><form></form>";
	return body.childNodes.length === 2;
} )();


// Argument "data" should be string of html
// context (optional): If specified, the fragment will be created in this context,
// defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
jQuery.parseHTML = function( data, context, keepScripts ) {
	if ( typeof data !== "string" ) {
		return [];
	}
	if ( typeof context === "boolean" ) {
		keepScripts = context;
		context = false;
	}

	var base, parsed, scripts;

	if ( !context ) {

		// Stop scripts or inline event handlers from being executed immediately
		// by using document.implementation
		if ( support.createHTMLDocument ) {
			context = document.implementation.createHTMLDocument( "" );

			// Set the base href for the created document
			// so any parsed elements with URLs
			// are based on the document's URL (gh-2965)
			base = context.createElement( "base" );
			base.href = document.location.href;
			context.head.appendChild( base );
		} else {
			context = document;
		}
	}

	parsed = rsingleTag.exec( data );
	scripts = !keepScripts && [];

	// Single tag
	if ( parsed ) {
		return [ context.createElement( parsed[ 1 ] ) ];
	}

	parsed = buildFragment( [ data ], context, scripts );

	if ( scripts && scripts.length ) {
		jQuery( scripts ).remove();
	}

	return jQuery.merge( [], parsed.childNodes );
};


/**
 * Load a url into a page
 */
jQuery.fn.load = function( url, params, callback ) {
	var selector, type, response,
		self = this,
		off = url.indexOf( " " );

	if ( off > -1 ) {
		selector = stripAndCollapse( url.slice( off ) );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax( {
			url: url,

			// If "type" variable is undefined, then "GET" method will be used.
			// Make value of this field explicit since
			// user can override it through ajaxSetup method
			type: type || "GET",
			dataType: "html",
			data: params
		} ).done( function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery( "<div>" ).append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		// If the request succeeds, this function gets "data", "status", "jqXHR"
		// but they are ignored because response was set above.
		// If it fails, this function gets "jqXHR", "status", "error"
		} ).always( callback && function( jqXHR, status ) {
			self.each( function() {
				callback.apply( this, response || [ jqXHR.responseText, status, jqXHR ] );
			} );
		} );
	}

	return this;
};




// Attach a bunch of functions for handling common AJAX events
jQuery.each( [
	"ajaxStart",
	"ajaxStop",
	"ajaxComplete",
	"ajaxError",
	"ajaxSuccess",
	"ajaxSend"
], function( i, type ) {
	jQuery.fn[ type ] = function( fn ) {
		return this.on( type, fn );
	};
} );




jQuery.expr.pseudos.animated = function( elem ) {
	return jQuery.grep( jQuery.timers, function( fn ) {
		return elem === fn.elem;
	} ).length;
};




jQuery.offset = {
	setOffset: function( elem, options, i ) {
		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
			position = jQuery.css( elem, "position" ),
			curElem = jQuery( elem ),
			props = {};

		// Set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		curOffset = curElem.offset();
		curCSSTop = jQuery.css( elem, "top" );
		curCSSLeft = jQuery.css( elem, "left" );
		calculatePosition = ( position === "absolute" || position === "fixed" ) &&
			( curCSSTop + curCSSLeft ).indexOf( "auto" ) > -1;

		// Need to be able to calculate position if either
		// top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;

		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( isFunction( options ) ) {

			// Use jQuery.extend here to allow modification of coordinates argument (gh-1848)
			options = options.call( elem, i, jQuery.extend( {}, curOffset ) );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );

		} else {
			curElem.css( props );
		}
	}
};

jQuery.fn.extend( {

	// offset() relates an element's border box to the document origin
	offset: function( options ) {

		// Preserve chaining for setter
		if ( arguments.length ) {
			return options === undefined ?
				this :
				this.each( function( i ) {
					jQuery.offset.setOffset( this, options, i );
				} );
		}

		var rect, win,
			elem = this[ 0 ];

		if ( !elem ) {
			return;
		}

		// Return zeros for disconnected and hidden (display: none) elements (gh-2310)
		// Support: IE <=11 only
		// Running getBoundingClientRect on a
		// disconnected node in IE throws an error
		if ( !elem.getClientRects().length ) {
			return { top: 0, left: 0 };
		}

		// Get document-relative position by adding viewport scroll to viewport-relative gBCR
		rect = elem.getBoundingClientRect();
		win = elem.ownerDocument.defaultView;
		return {
			top: rect.top + win.pageYOffset,
			left: rect.left + win.pageXOffset
		};
	},

	// position() relates an element's margin box to its offset parent's padding box
	// This corresponds to the behavior of CSS absolute positioning
	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset, doc,
			elem = this[ 0 ],
			parentOffset = { top: 0, left: 0 };

		// position:fixed elements are offset from the viewport, which itself always has zero offset
		if ( jQuery.css( elem, "position" ) === "fixed" ) {

			// Assume position:fixed implies availability of getBoundingClientRect
			offset = elem.getBoundingClientRect();

		} else {
			offset = this.offset();

			// Account for the *real* offset parent, which can be the document or its root element
			// when a statically positioned element is identified
			doc = elem.ownerDocument;
			offsetParent = elem.offsetParent || doc.documentElement;
			while ( offsetParent &&
				( offsetParent === doc.body || offsetParent === doc.documentElement ) &&
				jQuery.css( offsetParent, "position" ) === "static" ) {

				offsetParent = offsetParent.parentNode;
			}
			if ( offsetParent && offsetParent !== elem && offsetParent.nodeType === 1 ) {

				// Incorporate borders into its offset, since they are outside its content origin
				parentOffset = jQuery( offsetParent ).offset();
				parentOffset.top += jQuery.css( offsetParent, "borderTopWidth", true );
				parentOffset.left += jQuery.css( offsetParent, "borderLeftWidth", true );
			}
		}

		// Subtract parent offsets and element margins
		return {
			top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
		};
	},

	// This method will return documentElement in the following cases:
	// 1) For the element inside the iframe without offsetParent, this method will return
	//    documentElement of the parent window
	// 2) For the hidden or detached element
	// 3) For body or html element, i.e. in case of the html node - it will return itself
	//
	// but those exceptions were never presented as a real life use-cases
	// and might be considered as more preferable results.
	//
	// This logic, however, is not guaranteed and can change at any point in the future
	offsetParent: function() {
		return this.map( function() {
			var offsetParent = this.offsetParent;

			while ( offsetParent && jQuery.css( offsetParent, "position" ) === "static" ) {
				offsetParent = offsetParent.offsetParent;
			}

			return offsetParent || documentElement;
		} );
	}
} );

// Create scrollLeft and scrollTop methods
jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function( method, prop ) {
	var top = "pageYOffset" === prop;

	jQuery.fn[ method ] = function( val ) {
		return access( this, function( elem, method, val ) {

			// Coalesce documents and windows
			var win;
			if ( isWindow( elem ) ) {
				win = elem;
			} else if ( elem.nodeType === 9 ) {
				win = elem.defaultView;
			}

			if ( val === undefined ) {
				return win ? win[ prop ] : elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : win.pageXOffset,
					top ? val : win.pageYOffset
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length );
	};
} );

// Support: Safari <=7 - 9.1, Chrome <=37 - 49
// Add the top/left cssHooks using jQuery.fn.position
// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
// Blink bug: https://bugs.chromium.org/p/chromium/issues/detail?id=589347
// getComputedStyle returns percent when specified for top/left/bottom/right;
// rather than make the css module depend on the offset module, just check for it here
jQuery.each( [ "top", "left" ], function( i, prop ) {
	jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
		function( elem, computed ) {
			if ( computed ) {
				computed = curCSS( elem, prop );

				// If curCSS returns percentage, fallback to offset
				return rnumnonpx.test( computed ) ?
					jQuery( elem ).position()[ prop ] + "px" :
					computed;
			}
		}
	);
} );


// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name },
		function( defaultExtra, funcName ) {

		// Margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return access( this, function( elem, type, value ) {
				var doc;

				if ( isWindow( elem ) ) {

					// $( window ).outerWidth/Height return w/h including scrollbars (gh-1729)
					return funcName.indexOf( "outer" ) === 0 ?
						elem[ "inner" + name ] :
						elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
					// whichever is greatest
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?

					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable );
		};
	} );
} );


jQuery.each( ( "blur focus focusin focusout resize scroll click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup contextmenu" ).split( " " ),
	function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( data, fn ) {
		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};
} );

jQuery.fn.extend( {
	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	}
} );




jQuery.fn.extend( {

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {

		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ?
			this.off( selector, "**" ) :
			this.off( types, selector || "**", fn );
	}
} );

// Bind a function to a context, optionally partially applying any
// arguments.
// jQuery.proxy is deprecated to promote standards (specifically Function#bind)
// However, it is not slated for removal any time soon
jQuery.proxy = function( fn, context ) {
	var tmp, args, proxy;

	if ( typeof context === "string" ) {
		tmp = fn[ context ];
		context = fn;
		fn = tmp;
	}

	// Quick check to determine if target is callable, in the spec
	// this throws a TypeError, but we will just return undefined.
	if ( !isFunction( fn ) ) {
		return undefined;
	}

	// Simulated bind
	args = slice.call( arguments, 2 );
	proxy = function() {
		return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
	};

	// Set the guid of unique handler to the same of original handler, so it can be removed
	proxy.guid = fn.guid = fn.guid || jQuery.guid++;

	return proxy;
};

jQuery.holdReady = function( hold ) {
	if ( hold ) {
		jQuery.readyWait++;
	} else {
		jQuery.ready( true );
	}
};
jQuery.isArray = Array.isArray;
jQuery.parseJSON = JSON.parse;
jQuery.nodeName = nodeName;
jQuery.isFunction = isFunction;
jQuery.isWindow = isWindow;
jQuery.camelCase = camelCase;
jQuery.type = toType;

jQuery.now = Date.now;

jQuery.isNumeric = function( obj ) {

	// As of jQuery 3.0, isNumeric is limited to
	// strings and numbers (primitives or objects)
	// that can be coerced to finite numbers (gh-2662)
	var type = jQuery.type( obj );
	return ( type === "number" || type === "string" ) &&

		// parseFloat NaNs numeric-cast false positives ("")
		// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
		// subtraction forces infinities to NaN
		!isNaN( obj - parseFloat( obj ) );
};




var

	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$;

jQuery.noConflict = function( deep ) {
	if ( window.$ === jQuery ) {
		window.$ = _$;
	}

	if ( deep && window.jQuery === jQuery ) {
		window.jQuery = _jQuery;
	}

	return jQuery;
};

// Expose jQuery and $ identifiers, even in AMD
// (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
// and CommonJS for browser emulators (#13566)
if ( !noGlobal ) {
	window.jQuery = window.$ = jQuery;
}




return jQuery;
} );
});

var HotkeysContext =
/*#__PURE__*/
function () {
  function HotkeysContext(name, definitions, enabled) {
    babelHelpers.classCallCheck(this, HotkeysContext);
    this.name = name;
    this.definitions = Object.assign({}, definitions);
    this.enabled = enabled;
  }

  babelHelpers.createClass(HotkeysContext, [{
    key: "extend",
    value: function extend() {
      var _this = this;

      var definitions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (babelHelpers.typeof(definitions) !== 'object') {
        return;
      }

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
        return jquery(document).bind(bindingKey, hotkey, function (event) {
          if (!_this2.enabled) {
            return;
          }

          commands.run(command);
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
        jquery(document).unbind(bindingKey);
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
      jquery(document).unbind("keydown.hotkey.".concat(this.name));
    }
  }]);
  return HotkeysContext;
}();

var HotkeysManager =
/*#__PURE__*/
function () {
  function HotkeysManager() {
    babelHelpers.classCallCheck(this, HotkeysManager);
    this.contexts = {};
    this.defaults = {};
    this.currentContextName = null;
    this.enabled = true;
    this.retrieveFunction = null;
    this.storeFunction = null;
  }

  babelHelpers.createClass(HotkeysManager, [{
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
      var currentContext = this.getCurrentContext() || context;

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

      this.getContext(contextName).register(command, hotkey);
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

var FUNCTION$1 = 'function';

var MetadataProvider =
/*#__PURE__*/
function () {
  function MetadataProvider() {
    babelHelpers.classCallCheck(this, MetadataProvider);
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


  babelHelpers.createClass(MetadataProvider, [{
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

      var cornerstoneMath = external.cornerstoneMath;
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

      if (babelHelpers.typeof(this._provider) !== FUNCTION$1) {
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

var StudyPrefetcher =
/*#__PURE__*/
function () {
  function StudyPrefetcher(studies) {
    var _this = this;

    babelHelpers.classCallCheck(this, StudyPrefetcher);
    babelHelpers.defineProperty(this, "cacheFullHandler", function () {
      log$1.warn('Cache full');

      _this.stopPrefetching();
    });
    this.studies = studies || [];
    this.prefetchDisplaySetsTimeout = 300;
    this.lastActiveViewportElement = null;
    external.cornerstone.events.addEventListener('cornerstoneimagecachefull.StudyPrefetcher', this.cacheFullHandler);
  }

  babelHelpers.createClass(StudyPrefetcher, [{
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
var setCommandContext = function setCommandContext(state) {
  return {
    type: 'SET_COMMAND_CONTEXT',
    state: state
  };
};
var setViewportSpecificData = function setViewportSpecificData(viewportIndex, data) {
  return {
    type: 'SET_VIEWPORT_SPECIFIC_DATA',
    viewportIndex: viewportIndex,
    data: data
  };
};
var clearViewportSpecificData = function clearViewportSpecificData(viewportIndex) {
  return {
    type: 'CLEAR_VIEWPORT_SPECIFIC_DATA',
    viewportIndex: viewportIndex
  };
};
var addPlugin = function addPlugin(plugin) {
  return {
    type: 'ADD_PLUGIN',
    plugin: plugin
  };
};
var setAvailableButtons = function setAvailableButtons(buttons) {
  return {
    type: 'SET_AVAILABLE_BUTTONS',
    buttons: buttons
  };
};
var actions = {
  setToolActive: setToolActive,
  setViewportActive: setViewportActive,
  setLayout: setLayout,
  setStudyLoadingProgress: setStudyLoadingProgress,
  clearStudyLoadingProgress: clearStudyLoadingProgress,
  setUserPreferences: setUserPreferences,
  setCommandContext: setCommandContext,
  setViewportSpecificData: setViewportSpecificData,
  clearViewportSpecificData: clearViewportSpecificData,
  addPlugin: addPlugin,
  setAvailableButtons: setAvailableButtons
};

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
  var images = displaySet.images;

  if (!images) {
    return;
  }

  var numImages = images.length;
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
    studyInstanceUid: study.studyInstanceUid,
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

var BaseLoadingListener =
/*#__PURE__*/
function () {
  function BaseLoadingListener(stack) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    babelHelpers.classCallCheck(this, BaseLoadingListener);
    this.id = BaseLoadingListener.getNewId();
    this.stack = stack;
    this.startListening();
    this.statsItemsLimit = options.statsItemsLimit || 2;
    this.stats = {
      items: [],
      total: 0,
      elapsedTime: 0,
      speed: 0
    };
    this._setProgressData = options._setProgressData;
    this._clearProgressById = options._clearProgressById; // Register the start point to make it possible to calculate
    // bytes/s or frames/s when the first byte or frame is received

    this._addStatsData(0); // Update the progress before starting the download
    // to make it possible to update the UI


    this._updateProgress();
  }

  babelHelpers.createClass(BaseLoadingListener, [{
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
      throw new Error('`startListening` must be implemented by child classes');
    }
  }, {
    key: "stopListening",
    value: function stopListening() {
      throw new Error('`stopListening` must be implemented by child classes');
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
  babelHelpers.inherits(DICOMFileLoadingListener, _BaseLoadingListener);

  function DICOMFileLoadingListener(stack, options) {
    var _this;

    babelHelpers.classCallCheck(this, DICOMFileLoadingListener);
    _this = babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(DICOMFileLoadingListener).call(this, stack, options));
    babelHelpers.defineProperty(babelHelpers.assertThisInitialized(babelHelpers.assertThisInitialized(_this)), "_imageLoadProgressEventHandler", function (e) {
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

  babelHelpers.createClass(DICOMFileLoadingListener, [{
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
      // TODO: Add this event as a constant in Cornerstone
      return 'cornerstoneimageloadprogress.' + this.id;
    }
  }, {
    key: "startListening",
    value: function startListening() {
      var imageLoadProgressEventName = this._getImageLoadProgressEventName();

      this.imageLoadProgressEventHandler = this._imageLoadProgressEventHandle.bind(this);
      this.stopListening();
      external.cornerstone.events.addEventListener(imageLoadProgressEventName, this.imageLoadProgressEventHandle);
    }
  }, {
    key: "stopListening",
    value: function stopListening() {
      var imageLoadProgressEventName = this._getImageLoadProgressEventName();

      external.cornerstone.events.removeEventListener(imageLoadProgressEventName, this.imageLoadProgressEventHandle);
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
  babelHelpers.inherits(StackLoadingListener, _BaseLoadingListener2);

  function StackLoadingListener(stack) {
    var _this2;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    babelHelpers.classCallCheck(this, StackLoadingListener);
    options.statsItemsLimit = 20;
    _this2 = babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(StackLoadingListener).call(this, stack, options));
    _this2.imageDataMap = _this2._convertImageIdsArrayToMap(stack.imageIds);
    _this2.framesStatus = _this2._createArray(stack.imageIds.length, false);
    _this2.loadedCount = 0; // Check how many instances has already been download (cached)

    _this2._checkCachedData();

    return _this2;
  }

  babelHelpers.createClass(StackLoadingListener, [{
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
      return "".concat(external.cornerstone.EVENTS.IMAGE_LOADED, ".").concat(this.id);
    }
  }, {
    key: "_getImageCachePromiseRemoveEventName",
    value: function _getImageCachePromiseRemoveEventName() {
      return "".concat(external.cornerstone.EVENTS.IMAGE_CACHE_PROMISE_REMOVED, ".").concat(this.id);
    }
  }, {
    key: "_imageLoadedEventHandler",
    value: function _imageLoadedEventHandler(e) {
      this._updateFrameStatus(e.detail.image.imageId, true);
    }
  }, {
    key: "_imageCachePromiseRemovedEventHandler",
    value: function _imageCachePromiseRemovedEventHandler(e) {
      this._updateFrameStatus(e.detail.imageId, false);
    }
  }, {
    key: "startListening",
    value: function startListening() {
      var imageLoadedEventName = this._getImageLoadedEventName();

      var imageCachePromiseRemovedEventName = this._getImageCachePromiseRemoveEventName();

      this.imageLoadedEventHandler = this._imageLoadedEventHandler.bind(this);
      this.imageCachePromiseRemovedEventHandler = this._imageCachePromiseRemovedEventHandler.bind(this);
      this.stopListening();
      external.cornerstone.events.addEventListener(imageLoadedEventName, this.imageLoadedEventHandler);
      external.cornerstone.events.addEventListener(imageCachePromiseRemovedEventName, this.imageCachePromiseRemovedEventHandler);
    }
  }, {
    key: "stopListening",
    value: function stopListening() {
      var imageLoadedEventName = this._getImageLoadedEventName();

      var imageCachePromiseRemovedEventName = this._getImageCachePromiseRemoveEventName();

      external.cornerstone.events.removeEventListener(imageLoadedEventName, this.imageLoadedEventHandler);
      external.cornerstone.events.removeEventListener(imageCachePromiseRemovedEventName, this.imageCachePromiseRemovedEventHandler);
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
      // TODO: This method (and _clearProgressById) need to access
      // the Redux store and should therefore be provided from the
      // application. I've added a workaround to pass this in through
      // the 'options' variable on instantiation, but this is really ugly.
      // We could consider making the StudyLoadingListener a higher-order
      // component which would set this stuff itself.
      throw new Error("The _setProgressData function must be provided in StudyLoadingListener's options");
    }
  }, {
    key: "_clearProgressById",
    value: function _clearProgressById(progressId) {
      throw new Error("The _clearProgressById function must be provided in StudyLoadingListener's options");
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
  function StudyLoadingListener(options) {
    babelHelpers.classCallCheck(this, StudyLoadingListener);
    this.listeners = {};
    this.options = options;
  }

  babelHelpers.createClass(StudyLoadingListener, [{
    key: "addStack",
    value: function addStack(stack, stackMetaData) {
      // TODO: Make this work for plugins
      if (!stack) {
        //console.log('Skipping adding stack to StudyLoadingListener');
        return;
      }

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
        var stack = StackManager.findOrCreateStack(study, displaySet); // TODO: Make this work for plugins

        if (!stack) {
          console.warn('Skipping adding displaySet to StudyLoadingListener');
          console.warn(displaySet);
          return;
        }

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
        return new StackLoadingListener(stack, this.options);
      } else {
        return new DICOMFileLoadingListener(stack, this.options);
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
    value: function getInstance(options) {
      if (!StudyLoadingListener._instance) {
        StudyLoadingListener._instance = new StudyLoadingListener(options);
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
    babelHelpers.classCallCheck(this, TypeSafeCollection);
    this._operationCount = MIN_COUNT;
    this._elementList = [];
    this._handlers = Object.create(null);
  }
  /**
   * Private Methods
   */


  babelHelpers.createClass(TypeSafeCollection, [{
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
  return subject instanceof Object || babelHelpers.typeof(subject) === 'object' && subject !== null;
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
    babelHelpers.classCallCheck(this, StudyMetadataSource);
  }

  babelHelpers.createClass(StudyMetadataSource, [{
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

var HotkeysUtil =
/*#__PURE__*/
function () {
  function HotkeysUtil() {
    var _this = this;

    babelHelpers.classCallCheck(this, HotkeysUtil);
    this.toolCommands = {
      wwwc: 'W/L',
      zoom: 'Zoom',
      angle: 'Angle',
      dragProbe: 'Pixel Probe',
      ellipticalRoi: 'Elliptical ROI',
      rectangleRoi: 'Rectangle ROI',
      // magnify: 'Magnify', -- TODO: implement magnify
      annotate: 'Annotate',
      stackScroll: 'StackScroll',
      pan: 'Pan',
      length: 'Length Measurement',
      wwwcRegion: 'W/L by Region',
      crosshairs: 'Crosshairs'
    };
    this.viewerportCommands = {
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      zoomToFit: 'Zoom to Fit',
      invert: 'Invert',
      flipH: 'Flip Horizontally',
      flipV: 'Flip Vertically',
      rotateR: 'Rotate Right',
      rotateL: 'Rotate Left',
      resetViewport: 'Reset',
      clearTools: 'Clear Tools'
    };
    this.commands = {
      scrollDown: {
        name: 'Scroll Down',
        action: function action() {
          return log$1.warn('TODO: scroll down');
        }
      },
      scrollUp: {
        name: 'Scroll Up',
        action: function action() {
          return log$1.warn('TODO: scroll up');
        }
      },
      scrollFirstImage: {
        name: 'Scroll to First Image',
        action: function action() {
          return log$1.warn('TODO: scroll to first image');
        }
      },
      scrollLastImage: {
        name: 'Scroll to Last Image',
        action: function action() {
          return log$1.warn('TODO: scroll last image');
        }
      },
      previousDisplaySet: {
        name: 'Previous Series',
        action: function action() {
          return console.log('TODO: previous series');
        },
        disabled: function disabled() {
          return !_this._canMoveDisplaySets(false);
        }
      },
      nextDisplaySet: {
        name: 'Next Series',
        action: function action() {
          return console.log('TODO: next display set');
        },
        disabled: function disabled() {
          return !_this._canMoveDisplaySets(true);
        }
      },
      nextPanel: {
        name: 'Next Image Viewport',
        action: function action() {
          return log$1.warn('TODO: nextpanel');
        }
      },
      previousPanel: {
        name: 'Previous Image Viewport',
        action: function action() {
          return log$1.warn('TODO: previous panel');
        }
      }
    };
  }

  babelHelpers.createClass(HotkeysUtil, [{
    key: "_isActiveViewportEmpty",
    value: function _isActiveViewportEmpty() {
      // TODO: check if it is empty using redux. Need to put viewportData into redux.
      // const activeViewport = Session.get('activeViewport') || 0;
      // return $('.imageViewerViewport').eq(activeViewport).hasClass('empty');
      return false;
    }
    /**
     * Tools. ex: window/level, zoom, pan etc
     * @param {*} map
     * @param {String} contextName
     */

  }, {
    key: "_registerToolCommands",
    value: function _registerToolCommands(map, contextName) {
      Object.keys(map).forEach(function (toolId) {
        var commandName = map[toolId];
        commands.register(contextName, toolId, {
          name: commandName,
          action: function action() {
            var setToolActive$$1 = actions.setToolActive;
            window.store.dispatch(setToolActive$$1(commandName));
          },
          params: toolId
        });
      });
    }
    /**
     * viewport commands. ex: cine play, pause etc
     * @param {*} map
     * @param {String} contextName
     */

  }, {
    key: "_registerViewportCommands",
    value: function _registerViewportCommands(map, contextName) {
      var _this2 = this;

      Object.keys(map).forEach(function (toolId) {
        var commandName = map[toolId];
        commands.register(contextName, toolId, {
          name: commandName,
          action: function action() {
            console.log('TODO: viewportUtils[commandId] - viewport set the active tool ->' + commandName);
          },
          params: toolId,
          disabled: _this2._isActiveViewportEmpty
        });
      });
    }
  }, {
    key: "_canMoveDisplaySets",
    value: function _canMoveDisplaySets(isNext) {
      return false; // TODO
      // if (!OHIF.viewerbase.layoutManager) {
      //     return false;
      // } else {
      //     return OHIF.viewerbase.layoutManager.canMoveDisplaySets(isNext);
      // }
    }
    /**
     * Register default commands and set global hotkeys listeners
     * @param {String} contextName
     */

  }, {
    key: "setup",
    value: function setup() {
      var contextName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'viewer';
      commands.createContext(contextName);

      this._registerToolCommands(this.toolCommands, contextName);

      this._registerViewportCommands(this.viewerportCommands, contextName); // TODO: preset wl
      // const applyPreset = presetName => WLPresets.applyWLPresetToActiveElement(presetName);


      var _loop = function _loop(i) {
        commands.register(contextName, "WLPreset".concat(i), {
          name: "W/L Preset ".concat(i + 1),
          action: function action() {
            console.log("TODO: window level preset - WLPreset".concat(i));
          },
          // TODO applyPreset,
          params: i
        });
      };

      for (var i = 0; i < 10; i++) {
        _loop(i);
      } // Register viewport navigation commands


      commands.set(contextName, this.commands, true);
      this.setHotkeys(window.store.getState().preferences.hotKeysData, contextName);
      var setCommandContext$$1 = actions.setCommandContext;
      window.store.dispatch(setCommandContext$$1({
        context: contextName
      }));
    }
    /**
     * Updates and sets hotkeys to global listeners
     * @param {*} hotKeysPreferences -- default redux values
     * @param {*} contextName  -- default redux value
     */

  }, {
    key: "setHotkeys",
    value: function setHotkeys() {
      var hotKeysPreferences = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window.store.getState().preferences.hotKeysData;
      var contextName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window.store.getState().commandContext.context;
      var hotKeys = {};
      Object.keys(hotKeysPreferences).forEach(function (key) {
        hotKeys[key] = hotKeysPreferences[key].command;
      });
      hotkeys.set(contextName, hotKeys, true);
    }
  }]);
  return HotkeysUtil;
}();

var classes = {
  MetadataProvider: MetadataProvider,
  CommandsManager: CommandsManager,
  HotkeysContext: HotkeysContext,
  HotkeysManager: HotkeysManager,
  HotkeysUtil: HotkeysUtil,
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

window.$ = window.jQuery = jquery;

require('jquery.hotkeys'); // TODO: check why import does not work. import('jquery.hotkeys');
// Create hotkeys namespace using a HotkeysManager class instance


var hotkeys = new HotkeysManager();
var hotkeysUtil = new HotkeysUtil(); // Export relevant objects

var FUNCTION$2 = 'function';
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
    babelHelpers.classCallCheck(this, Node);
    this.value = 0;
    this.children = {};
    this.handlers = {};
  }

  babelHelpers.createClass(Node, [{
    key: "getPathComponents",
    value: function getPathComponents(path) {
      return babelHelpers.typeof(path) === STRING$3 ? path.split(SEPARATOR) : null;
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
      } else if (babelHelpers.typeof(name) === STRING$3 && name !== WILDCARD) {
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

      if (babelHelpers.typeof(type) === STRING$3 && babelHelpers.typeof(handler) === FUNCTION$2) {
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

      if (babelHelpers.typeof(type) === STRING$3 && babelHelpers.typeof(handler) === FUNCTION$2) {
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
      if (babelHelpers.typeof(type) === STRING$3) {
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
    babelHelpers.classCallCheck(this, ObjectPath);
  }

  babelHelpers.createClass(ObjectPath, null, [{
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
      return babelHelpers.typeof(object) === 'object' && object !== null && object instanceof Object;
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

var PLUGIN_TYPES = {
  VIEWPORT: 'viewport',
  SOP_CLASS_HANDLER: 'sopClassHandler'
};
var plugins = {
  PLUGIN_TYPES: PLUGIN_TYPES,
  availablePlugins: []
};

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

function getDisplaySetFromSopClassPluginsIfApplicable(series, study) {
  var uniqueSopClassUidsInSeries = new Set();
  series.forEachInstance(function (instance) {
    var instanceSopClassUid = instance.getRawValue('x00080016');
    uniqueSopClassUidsInSeries.add(instanceSopClassUid);
  });
  var sopClassUids = Array.from(uniqueSopClassUidsInSeries); // TODO: For now only use the plugins if all instances have the same sopClassUid

  if (sopClassUids.length !== 1) {
    return;
  }

  var sopClassUid = sopClassUids[0];
  var availablePlugins = plugins.availablePlugins,
      PLUGIN_TYPES = plugins.PLUGIN_TYPES;
  var sopClassHandlerPlugins = availablePlugins.filter(function (plugin) {
    return plugin.type === PLUGIN_TYPES.SOP_CLASS_HANDLER;
  }); // TODO: A bit weird that this is plugin.component

  var sopClassHandlerPluginClasses = sopClassHandlerPlugins.map(function (plugin) {
    return plugin.component;
  });
  var applicablePlugins = sopClassHandlerPluginClasses.filter(function (plugin) {
    return plugin.sopClassUids.includes(sopClassUid);
  }); // TODO: Sort by something

  if (!applicablePlugins || !applicablePlugins.length) {
    return;
  }

  var plugin = applicablePlugins[0];
  return plugin.getDisplaySetFromSeries(series, study);
}
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
    }

    var displaySet = getDisplaySetFromSopClassPluginsIfApplicable(series, study);

    if (displaySet) {
      displaySets.push(displaySet);
      return;
    } // Search through the instances (InstanceMetadata object) of this series
    // Split Multi-frame instances and Single-image modalities
    // into their own specific display sets. Place the rest of each
    // series into another display set.


    var stackableInstances = [];
    series.forEachInstance(function (instance) {
      // All imaging modalities must have a valid value for sopClassUid (x00080016) or rows (x00280010)
      if (!isImage(instance.getRawValue('x00080016')) && !instance.getRawValue('x00280010')) {
        return;
      }

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
      var _displaySet = makeDisplaySet(series, stackableInstances);

      _displaySet.setAttribute('studyInstanceUid', study.getStudyInstanceUID());

      displaySets.push(_displaySet);
    }
  });
  return displaySets;
}

var OHIFInstanceMetadata =
/*#__PURE__*/
function (_InstanceMetadata) {
  babelHelpers.inherits(OHIFInstanceMetadata, _InstanceMetadata);

  /**
   * @param {Object} Instance object.
   */
  function OHIFInstanceMetadata(data, series, study, uid) {
    var _this;

    babelHelpers.classCallCheck(this, OHIFInstanceMetadata);
    _this = babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(OHIFInstanceMetadata).call(this, data, uid));

    _this.init(series, study);

    return _this;
  }

  babelHelpers.createClass(OHIFInstanceMetadata, [{
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
  babelHelpers.inherits(OHIFSeriesMetadata, _SeriesMetadata);

  /**
   * @param {Object} Series object.
   */
  function OHIFSeriesMetadata(data, study, uid) {
    var _this;

    babelHelpers.classCallCheck(this, OHIFSeriesMetadata);
    _this = babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(OHIFSeriesMetadata).call(this, data, uid));

    _this.init(study);

    return _this;
  }

  babelHelpers.createClass(OHIFSeriesMetadata, [{
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
  babelHelpers.inherits(OHIFStudyMetadata, _StudyMetadata);

  /**
   * @param {Object} Study object.
   */
  function OHIFStudyMetadata(data, uid) {
    var _this;

    babelHelpers.classCallCheck(this, OHIFStudyMetadata);
    _this = babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(OHIFStudyMetadata).call(this, data, uid));

    _this.init();

    return _this;
  }

  babelHelpers.createClass(OHIFStudyMetadata, [{
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

    studyMetadata.setDisplaySets(displaySets); //OHIF.viewer.Studies.insert(study);
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

var cornerstone$1 = {
  MetadataProvider: MetadataProvider,
  getBoundingBox: getBoundingBox,
  pixelToPage: pixelToPage,
  repositionTextBox: repositionTextBox
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

      if (item && item.type === 'tool') {
        buttons = state.buttons.map(function (button) {
          if (button.command === action.tool) {
            button.active = true;
          } else if (button.type === 'tool') {
            button.active = false;
          }

          return button;
        });
      } else {
        log$1.warn("Tool ".concat(action.tool, " not found"));
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

var lodash_merge = createCommonjsModule(function (module, exports) {
/**
 * Lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright JS Foundation and other contributors <https://js.foundation/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used to detect hot functions by number of calls within a span of milliseconds. */
var HOT_COUNT = 800,
    HOT_SPAN = 16;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    asyncTag = '[object AsyncFunction]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    nullTag = '[object Null]',
    objectTag = '[object Object]',
    proxyTag = '[object Proxy]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    undefinedTag = '[object Undefined]',
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

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

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

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());

/* Node.js helper references. */
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
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
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
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
 * Gets the value at `key`, unless `key` is "__proto__".
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function safeGet(object, key) {
  return key == '__proto__'
    ? undefined
    : object[key];
}

/** Used for built-in method references. */
var arrayProto = Array.prototype,
    funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined,
    Symbol = root.Symbol,
    Uint8Array = root.Uint8Array,
    allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined,
    getPrototype = overArg(Object.getPrototypeOf, Object),
    objectCreate = Object.create,
    propertyIsEnumerable = objectProto.propertyIsEnumerable,
    splice = arrayProto.splice,
    symToStringTag = Symbol ? Symbol.toStringTag : undefined;

var defineProperty = (function() {
  try {
    var func = getNative(Object, 'defineProperty');
    func({}, '', {});
    return func;
  } catch (e) {}
}());

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined,
    nativeMax = Math.max,
    nativeNow = Date.now;

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map'),
    nativeCreate = getNative(Object, 'create');

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} proto The object to inherit from.
 * @returns {Object} Returns the new object.
 */
var baseCreate = (function() {
  function object() {}
  return function(proto) {
    if (!isObject(proto)) {
      return {};
    }
    if (objectCreate) {
      return objectCreate(proto);
    }
    object.prototype = proto;
    var result = new object;
    object.prototype = undefined;
    return result;
  };
}());

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

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
  this.size = 0;
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
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
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
  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
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
  this.size += this.has(key) ? 0 : 1;
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
      length = entries == null ? 0 : entries.length;

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
  this.size = 0;
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
  --this.size;
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
    ++this.size;
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
      length = entries == null ? 0 : entries.length;

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
  this.size = 0;
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
  var result = getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
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
  var data = getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
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
  var data = this.__data__ = new ListCache(entries);
  this.size = data.size;
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
  this.size = 0;
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
  var data = this.__data__,
      result = data['delete'](key);

  this.size = data.size;
  return result;
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
  var data = this.__data__;
  if (data instanceof ListCache) {
    var pairs = data.__data__;
    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
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
  var isArr = isArray(value),
      isArg = !isArr && isArguments(value),
      isBuff = !isArr && !isArg && isBuffer(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) &&
        !(skipIndexes && (
           // Safari 9 has enumerable `arguments.length` in strict mode.
           key == 'length' ||
           // Node.js 0.10 has enumerable non-index properties on buffers.
           (isBuff && (key == 'offset' || key == 'parent')) ||
           // PhantomJS 2 has enumerable non-index properties on typed arrays.
           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
           // Skip index properties.
           isIndex(key, length)
        ))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * This function is like `assignValue` except that it doesn't assign
 * `undefined` values.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignMergeValue(object, key, value) {
  if ((value !== undefined && !eq(object[key], value)) ||
      (value === undefined && !(key in object))) {
    baseAssignValue(object, key, value);
  }
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
    baseAssignValue(object, key, value);
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
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function baseAssignValue(object, key, value) {
  if (key == '__proto__' && defineProperty) {
    defineProperty(object, key, {
      'configurable': true,
      'enumerable': true,
      'value': value,
      'writable': true
    });
  } else {
    object[key] = value;
  }
}

/**
 * The base implementation of `baseForOwn` which iterates over `object`
 * properties returned by `keysFunc` and invokes `iteratee` for each property.
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike(value) && baseGetTag(value) == argsTag;
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
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
}

/**
 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeysIn(object) {
  if (!isObject(object)) {
    return nativeKeysIn(object);
  }
  var isProto = isPrototype(object),
      result = [];

  for (var key in object) {
    if (!(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * The base implementation of `_.merge` without support for multiple sources.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} [customizer] The function to customize merged values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMerge(object, source, srcIndex, customizer, stack) {
  if (object === source) {
    return;
  }
  baseFor(source, function(srcValue, key) {
    if (isObject(srcValue)) {
      stack || (stack = new Stack);
      baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
    }
    else {
      var newValue = customizer
        ? customizer(safeGet(object, key), srcValue, (key + ''), object, source, stack)
        : undefined;

      if (newValue === undefined) {
        newValue = srcValue;
      }
      assignMergeValue(object, key, newValue);
    }
  }, keysIn);
}

/**
 * A specialized version of `baseMerge` for arrays and objects which performs
 * deep merges and tracks traversed objects enabling objects with circular
 * references to be merged.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {string} key The key of the value to merge.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} mergeFunc The function to merge values.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
  var objValue = safeGet(object, key),
      srcValue = safeGet(source, key),
      stacked = stack.get(srcValue);

  if (stacked) {
    assignMergeValue(object, key, stacked);
    return;
  }
  var newValue = customizer
    ? customizer(objValue, srcValue, (key + ''), object, source, stack)
    : undefined;

  var isCommon = newValue === undefined;

  if (isCommon) {
    var isArr = isArray(srcValue),
        isBuff = !isArr && isBuffer(srcValue),
        isTyped = !isArr && !isBuff && isTypedArray(srcValue);

    newValue = srcValue;
    if (isArr || isBuff || isTyped) {
      if (isArray(objValue)) {
        newValue = objValue;
      }
      else if (isArrayLikeObject(objValue)) {
        newValue = copyArray(objValue);
      }
      else if (isBuff) {
        isCommon = false;
        newValue = cloneBuffer(srcValue, true);
      }
      else if (isTyped) {
        isCommon = false;
        newValue = cloneTypedArray(srcValue, true);
      }
      else {
        newValue = [];
      }
    }
    else if (isPlainObject(srcValue) || isArguments(srcValue)) {
      newValue = objValue;
      if (isArguments(objValue)) {
        newValue = toPlainObject(objValue);
      }
      else if (!isObject(objValue) || (srcIndex && isFunction(objValue))) {
        newValue = initCloneObject(srcValue);
      }
    }
    else {
      isCommon = false;
    }
  }
  if (isCommon) {
    // Recursively merge objects and arrays (susceptible to call stack limits).
    stack.set(srcValue, newValue);
    mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
    stack['delete'](srcValue);
  }
  assignMergeValue(object, key, newValue);
}

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  return setToString(overRest(func, start, identity), func + '');
}

/**
 * The base implementation of `setToString` without support for hot loop shorting.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var baseSetToString = !defineProperty ? identity : function(func, string) {
  return defineProperty(func, 'toString', {
    'configurable': true,
    'enumerable': false,
    'value': constant(string),
    'writable': true
  });
};

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
  var length = buffer.length,
      result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

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
  var isNew = !object;
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer
      ? customizer(object[key], source[key], key, object, source)
      : undefined;

    if (newValue === undefined) {
      newValue = source[key];
    }
    if (isNew) {
      baseAssignValue(object, key, newValue);
    } else {
      assignValue(object, key, newValue);
    }
  }
  return object;
}

/**
 * Creates a function like `_.assign`.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return baseRest(function(object, sources) {
    var index = -1,
        length = sources.length,
        customizer = length > 1 ? sources[length - 1] : undefined,
        guard = length > 2 ? sources[2] : undefined;

    customizer = (assigner.length > 3 && typeof customizer == 'function')
      ? (length--, customizer)
      : undefined;

    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, index, customizer);
      }
    }
    return object;
  });
}

/**
 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1,
        iterable = Object(object),
        props = keysFunc(object),
        length = props.length;

    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
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
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
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
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER : length;

  return !!length &&
    (type == 'number' ||
      (type != 'symbol' && reIsUint.test(value))) &&
        (value > -1 && value % 1 == 0 && value < length);
}

/**
 * Checks if the given arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
 *  else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
        ? (isArrayLike(object) && isIndex(index, object.length))
        : (type == 'string' && index in object)
      ) {
    return eq(object[index], value);
  }
  return false;
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
 * This function is like
 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * except that it includes inherited enumerable properties.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

/**
 * A specialized version of `baseRest` which transforms the rest array.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @param {Function} transform The rest array transform.
 * @returns {Function} Returns the new function.
 */
function overRest(func, start, transform) {
  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return apply(func, this, otherArgs);
  };
}

/**
 * Sets the `toString` method of `func` to return `string`.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var setToString = shortOut(baseSetToString);

/**
 * Creates a function that'll short out and invoke `identity` instead
 * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
 * milliseconds.
 *
 * @private
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new shortable function.
 */
function shortOut(func) {
  var count = 0,
      lastCalled = 0;

  return function() {
    var stamp = nativeNow(),
        remaining = HOT_SPAN - (stamp - lastCalled);

    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(undefined, arguments);
  };
}

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
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
var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
  return isObjectLike(value) && hasOwnProperty.call(value, 'callee') &&
    !propertyIsEnumerable.call(value, 'callee');
};

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
  if (!isObject(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
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
  return value != null && (type == 'object' || type == 'function');
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
  return value != null && typeof value == 'object';
}

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
    return false;
  }
  var proto = getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor == 'function' && Ctor instanceof Ctor &&
    funcToString.call(Ctor) == objectCtorString;
}

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

/**
 * Converts `value` to a plain object flattening inherited enumerable string
 * keyed properties of `value` to own properties of the plain object.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {Object} Returns the converted plain object.
 * @example
 *
 * function Foo() {
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.assign({ 'a': 1 }, new Foo);
 * // => { 'a': 1, 'b': 2 }
 *
 * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
 * // => { 'a': 1, 'b': 2, 'c': 3 }
 */
function toPlainObject(value) {
  return copyObject(value, keysIn(value));
}

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
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
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
}

/**
 * This method is like `_.assign` except that it recursively merges own and
 * inherited enumerable string keyed properties of source objects into the
 * destination object. Source properties that resolve to `undefined` are
 * skipped if a destination value exists. Array and plain object properties
 * are merged recursively. Other objects and value types are overridden by
 * assignment. Source objects are applied from left to right. Subsequent
 * sources overwrite property assignments of previous sources.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 0.5.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var object = {
 *   'a': [{ 'b': 2 }, { 'd': 4 }]
 * };
 *
 * var other = {
 *   'a': [{ 'c': 3 }, { 'e': 5 }]
 * };
 *
 * _.merge(object, other);
 * // => { 'a': [{ 'b': 2, 'c': 3 }, { 'd': 4, 'e': 5 }] }
 */
var merge = createAssigner(function(object, source, srcIndex) {
  baseMerge(object, source, srcIndex);
});

/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new constant function.
 * @example
 *
 * var objects = _.times(2, _.constant({ 'a': 1 }));
 *
 * console.log(objects);
 * // => [{ 'a': 1 }, { 'a': 1 }]
 *
 * console.log(objects[0] === objects[1]);
 * // => true
 */
function constant(value) {
  return function() {
    return value;
  };
}

/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
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

module.exports = merge;
});

var defaultState = {
  activeViewportIndex: 0,
  layout: {
    viewports: [{
      height: '100%',
      width: '100%'
    }]
  },
  viewportSpecificData: {}
};

var viewports = function viewports() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultState;
  var action = arguments.length > 1 ? arguments[1] : undefined;
  var viewportSpecificData;

  switch (action.type) {
    case 'SET_VIEWPORT_ACTIVE':
      return Object.assign({}, state, {
        activeViewportIndex: action.viewportIndex
      });

    case 'SET_LAYOUT':
      return Object.assign({}, state, {
        layout: action.layout
      });

    case 'SET_VIEWPORT_SPECIFIC_DATA':
      var currentData = lodash_clonedeep(state.viewportSpecificData[action.viewportIndex]) || {};
      viewportSpecificData = lodash_clonedeep(state.viewportSpecificData);
      viewportSpecificData[action.viewportIndex] = lodash_merge({}, currentData, action.data);
      return Object.assign({}, state, {
        viewportSpecificData: viewportSpecificData
      });

    case 'CLEAR_VIEWPORT_SPECIFIC_DATA':
      viewportSpecificData = lodash_clonedeep(state.viewportSpecificData);
      viewportSpecificData[action.viewportIndex] = {};
      return Object.assign({}, state, {
        viewportSpecificData: viewportSpecificData
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

    case 'SET_SERVERS':
      return Object.assign({}, state, {
        servers: action.servers
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
  var progress;
  var lastUpdated;

  switch (action.type) {
    case 'SET_STUDY_LOADING_PROGRESS':
      progress = lodash_clonedeep(state).progress;
      progress[action.progressId] = action.progressData; // This is a workaround so we can easily identify changes
      // to the progress object without doing deep comparison.

      lastUpdated = new Date().getTime();
      return Object.assign({}, state, {
        progress: progress,
        lastUpdated: lastUpdated
      });

    case 'CLEAR_STUDY_LOADING_PROGRESS':
      progress = lodash_clonedeep(state).progress;
      delete progress[action.progressId];
      lastUpdated = new Date().getTime();
      return Object.assign({}, state, {
        progress: progress,
        lastUpdated: lastUpdated
      });

    default:
      return state;
  }
};

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
      return lodash_clonedeep(state) || lodash_clonedeep(defaultState$3);
  }
};

var defaultState$4 = {
  context: 'viewer'
};

var commandContext = function commandContext() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultState$4;
  var action = arguments.length > 1 ? arguments[1] : undefined;

  switch (action.type) {
    case 'SET_COMMAND_CONTEXT':
      return Object.assign({}, state, {
        context: action.state.context
      });

    default:
      return state;
  }
};

var defaultState$5 = {
  availablePlugins: []
};

var plugins$1 = function plugins$$1() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultState$5;
  var action = arguments.length > 1 ? arguments[1] : undefined;

  switch (action.type) {
    case 'ADD_PLUGIN':
      var availablePlugins = state.availablePlugins;
      var alreadyExists = availablePlugins.find(function (plugin) {
        return plugin.id === action.plugin.id;
      });

      if (alreadyExists) {
        return state;
      }

      availablePlugins.push({
        id: action.plugin.id,
        type: action.plugin.type
      }); // Not sure where else to put this. We shouldn't store functions in Redux, so I'll do this instead

      plugins.availablePlugins.push(action.plugin);
      return Object.assign({}, state, {
        availablePlugins: availablePlugins
      });

    default:
      return state;
  }
};

var reducers = {
  tools: tools,
  viewports: viewports,
  servers: servers,
  loading: loading,
  preferences: preferences,
  commandContext: commandContext,
  plugins: plugins$1
};

var redux = {
  reducers: reducers,
  actions: actions
};

// TODO: This is duplicated in TypeSafeCollection
function isObject(subject) {
  return subject instanceof Object || babelHelpers.typeof(subject) === 'object' && subject !== null;
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

      if (babelHelpers.typeof(currentValue) === 'object') {
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

var validate = createCommonjsModule(function (module, exports) {
/*!
 * validate.js 0.12.0
 *
 * (c) 2013-2017 Nicklas Ansman, 2013 Wrapp
 * Validate.js may be freely distributed under the MIT license.
 * For all details and documentation:
 * http://validatejs.org/
 */

(function(exports, module, define) {

  // The main function that calls the validators specified by the constraints.
  // The options are the following:
  //   - format (string) - An option that controls how the returned value is formatted
  //     * flat - Returns a flat array of just the error messages
  //     * grouped - Returns the messages grouped by attribute (default)
  //     * detailed - Returns an array of the raw validation data
  //   - fullMessages (boolean) - If `true` (default) the attribute name is prepended to the error.
  //
  // Please note that the options are also passed to each validator.
  var validate = function(attributes, constraints, options) {
    options = v.extend({}, v.options, options);

    var results = v.runValidations(attributes, constraints, options)
      ;

    if (results.some(function(r) { return v.isPromise(r.error); })) {
      throw new Error("Use validate.async if you want support for promises");
    }
    return validate.processValidationResults(results, options);
  };

  var v = validate;

  // Copies over attributes from one or more sources to a single destination.
  // Very much similar to underscore's extend.
  // The first argument is the target object and the remaining arguments will be
  // used as sources.
  v.extend = function(obj) {
    [].slice.call(arguments, 1).forEach(function(source) {
      for (var attr in source) {
        obj[attr] = source[attr];
      }
    });
    return obj;
  };

  v.extend(validate, {
    // This is the version of the library as a semver.
    // The toString function will allow it to be coerced into a string
    version: {
      major: 0,
      minor: 12,
      patch: 0,
      metadata: null,
      toString: function() {
        var version = v.format("%{major}.%{minor}.%{patch}", v.version);
        if (!v.isEmpty(v.version.metadata)) {
          version += "+" + v.version.metadata;
        }
        return version;
      }
    },

    // Below is the dependencies that are used in validate.js

    // The constructor of the Promise implementation.
    // If you are using Q.js, RSVP or any other A+ compatible implementation
    // override this attribute to be the constructor of that promise.
    // Since jQuery promises aren't A+ compatible they won't work.
    Promise: typeof Promise !== "undefined" ? Promise : /* istanbul ignore next */ null,

    EMPTY_STRING_REGEXP: /^\s*$/,

    // Runs the validators specified by the constraints object.
    // Will return an array of the format:
    //     [{attribute: "<attribute name>", error: "<validation result>"}, ...]
    runValidations: function(attributes, constraints, options) {
      var results = []
        , attr
        , validatorName
        , value
        , validators
        , validator
        , validatorOptions
        , error;

      if (v.isDomElement(attributes) || v.isJqueryElement(attributes)) {
        attributes = v.collectFormValues(attributes);
      }

      // Loops through each constraints, finds the correct validator and run it.
      for (attr in constraints) {
        value = v.getDeepObjectValue(attributes, attr);
        // This allows the constraints for an attribute to be a function.
        // The function will be called with the value, attribute name, the complete dict of
        // attributes as well as the options and constraints passed in.
        // This is useful when you want to have different
        // validations depending on the attribute value.
        validators = v.result(constraints[attr], value, attributes, attr, options, constraints);

        for (validatorName in validators) {
          validator = v.validators[validatorName];

          if (!validator) {
            error = v.format("Unknown validator %{name}", {name: validatorName});
            throw new Error(error);
          }

          validatorOptions = validators[validatorName];
          // This allows the options to be a function. The function will be
          // called with the value, attribute name, the complete dict of
          // attributes as well as the options and constraints passed in.
          // This is useful when you want to have different
          // validations depending on the attribute value.
          validatorOptions = v.result(validatorOptions, value, attributes, attr, options, constraints);
          if (!validatorOptions) {
            continue;
          }
          results.push({
            attribute: attr,
            value: value,
            validator: validatorName,
            globalOptions: options,
            attributes: attributes,
            options: validatorOptions,
            error: validator.call(validator,
                value,
                validatorOptions,
                attr,
                attributes,
                options)
          });
        }
      }

      return results;
    },

    // Takes the output from runValidations and converts it to the correct
    // output format.
    processValidationResults: function(errors, options) {
      errors = v.pruneEmptyErrors(errors, options);
      errors = v.expandMultipleErrors(errors, options);
      errors = v.convertErrorMessages(errors, options);

      var format = options.format || "grouped";

      if (typeof v.formatters[format] === 'function') {
        errors = v.formatters[format](errors);
      } else {
        throw new Error(v.format("Unknown format %{format}", options));
      }

      return v.isEmpty(errors) ? undefined : errors;
    },

    // Runs the validations with support for promises.
    // This function will return a promise that is settled when all the
    // validation promises have been completed.
    // It can be called even if no validations returned a promise.
    async: function(attributes, constraints, options) {
      options = v.extend({}, v.async.options, options);

      var WrapErrors = options.wrapErrors || function(errors) {
        return errors;
      };

      // Removes unknown attributes
      if (options.cleanAttributes !== false) {
        attributes = v.cleanAttributes(attributes, constraints);
      }

      var results = v.runValidations(attributes, constraints, options);

      return new v.Promise(function(resolve, reject) {
        v.waitForResults(results).then(function() {
          var errors = v.processValidationResults(results, options);
          if (errors) {
            reject(new WrapErrors(errors, options, attributes, constraints));
          } else {
            resolve(attributes);
          }
        }, function(err) {
          reject(err);
        });
      });
    },

    single: function(value, constraints, options) {
      options = v.extend({}, v.single.options, options, {
        format: "flat",
        fullMessages: false
      });
      return v({single: value}, {single: constraints}, options);
    },

    // Returns a promise that is resolved when all promises in the results array
    // are settled. The promise returned from this function is always resolved,
    // never rejected.
    // This function modifies the input argument, it replaces the promises
    // with the value returned from the promise.
    waitForResults: function(results) {
      // Create a sequence of all the results starting with a resolved promise.
      return results.reduce(function(memo, result) {
        // If this result isn't a promise skip it in the sequence.
        if (!v.isPromise(result.error)) {
          return memo;
        }

        return memo.then(function() {
          return result.error.then(function(error) {
            result.error = error || null;
          });
        });
      }, new v.Promise(function(r) { r(); })); // A resolved promise
    },

    // If the given argument is a call: function the and: function return the value
    // otherwise just return the value. Additional arguments will be passed as
    // arguments to the function.
    // Example:
    // ```
    // result('foo') // 'foo'
    // result(Math.max, 1, 2) // 2
    // ```
    result: function(value) {
      var args = [].slice.call(arguments, 1);
      if (typeof value === 'function') {
        value = value.apply(null, args);
      }
      return value;
    },

    // Checks if the value is a number. This function does not consider NaN a
    // number like many other `isNumber` functions do.
    isNumber: function(value) {
      return typeof value === 'number' && !isNaN(value);
    },

    // Returns false if the object is not a function
    isFunction: function(value) {
      return typeof value === 'function';
    },

    // A simple check to verify that the value is an integer. Uses `isNumber`
    // and a simple modulo check.
    isInteger: function(value) {
      return v.isNumber(value) && value % 1 === 0;
    },

    // Checks if the value is a boolean
    isBoolean: function(value) {
      return typeof value === 'boolean';
    },

    // Uses the `Object` function to check if the given argument is an object.
    isObject: function(obj) {
      return obj === Object(obj);
    },

    // Simply checks if the object is an instance of a date
    isDate: function(obj) {
      return obj instanceof Date;
    },

    // Returns false if the object is `null` of `undefined`
    isDefined: function(obj) {
      return obj !== null && obj !== undefined;
    },

    // Checks if the given argument is a promise. Anything with a `then`
    // function is considered a promise.
    isPromise: function(p) {
      return !!p && v.isFunction(p.then);
    },

    isJqueryElement: function(o) {
      return o && v.isString(o.jquery);
    },

    isDomElement: function(o) {
      if (!o) {
        return false;
      }

      if (!o.querySelectorAll || !o.querySelector) {
        return false;
      }

      if (v.isObject(document) && o === document) {
        return true;
      }

      // http://stackoverflow.com/a/384380/699304
      /* istanbul ignore else */
      if (typeof HTMLElement === "object") {
        return o instanceof HTMLElement;
      } else {
        return o &&
          typeof o === "object" &&
          o !== null &&
          o.nodeType === 1 &&
          typeof o.nodeName === "string";
      }
    },

    isEmpty: function(value) {
      var attr;

      // Null and undefined are empty
      if (!v.isDefined(value)) {
        return true;
      }

      // functions are non empty
      if (v.isFunction(value)) {
        return false;
      }

      // Whitespace only strings are empty
      if (v.isString(value)) {
        return v.EMPTY_STRING_REGEXP.test(value);
      }

      // For arrays we use the length property
      if (v.isArray(value)) {
        return value.length === 0;
      }

      // Dates have no attributes but aren't empty
      if (v.isDate(value)) {
        return false;
      }

      // If we find at least one property we consider it non empty
      if (v.isObject(value)) {
        for (attr in value) {
          return false;
        }
        return true;
      }

      return false;
    },

    // Formats the specified strings with the given values like so:
    // ```
    // format("Foo: %{foo}", {foo: "bar"}) // "Foo bar"
    // ```
    // If you want to write %{...} without having it replaced simply
    // prefix it with % like this `Foo: %%{foo}` and it will be returned
    // as `"Foo: %{foo}"`
    format: v.extend(function(str, vals) {
      if (!v.isString(str)) {
        return str;
      }
      return str.replace(v.format.FORMAT_REGEXP, function(m0, m1, m2) {
        if (m1 === '%') {
          return "%{" + m2 + "}";
        } else {
          return String(vals[m2]);
        }
      });
    }, {
      // Finds %{key} style patterns in the given string
      FORMAT_REGEXP: /(%?)%\{([^\}]+)\}/g
    }),

    // "Prettifies" the given string.
    // Prettifying means replacing [.\_-] with spaces as well as splitting
    // camel case words.
    prettify: function(str) {
      if (v.isNumber(str)) {
        // If there are more than 2 decimals round it to two
        if ((str * 100) % 1 === 0) {
          return "" + str;
        } else {
          return parseFloat(Math.round(str * 100) / 100).toFixed(2);
        }
      }

      if (v.isArray(str)) {
        return str.map(function(s) { return v.prettify(s); }).join(", ");
      }

      if (v.isObject(str)) {
        return str.toString();
      }

      // Ensure the string is actually a string
      str = "" + str;

      return str
        // Splits keys separated by periods
        .replace(/([^\s])\.([^\s])/g, '$1 $2')
        // Removes backslashes
        .replace(/\\+/g, '')
        // Replaces - and - with space
        .replace(/[_-]/g, ' ')
        // Splits camel cased words
        .replace(/([a-z])([A-Z])/g, function(m0, m1, m2) {
          return "" + m1 + " " + m2.toLowerCase();
        })
        .toLowerCase();
    },

    stringifyValue: function(value, options) {
      var prettify = options && options.prettify || v.prettify;
      return prettify(value);
    },

    isString: function(value) {
      return typeof value === 'string';
    },

    isArray: function(value) {
      return {}.toString.call(value) === '[object Array]';
    },

    // Checks if the object is a hash, which is equivalent to an object that
    // is neither an array nor a function.
    isHash: function(value) {
      return v.isObject(value) && !v.isArray(value) && !v.isFunction(value);
    },

    contains: function(obj, value) {
      if (!v.isDefined(obj)) {
        return false;
      }
      if (v.isArray(obj)) {
        return obj.indexOf(value) !== -1;
      }
      return value in obj;
    },

    unique: function(array) {
      if (!v.isArray(array)) {
        return array;
      }
      return array.filter(function(el, index, array) {
        return array.indexOf(el) == index;
      });
    },

    forEachKeyInKeypath: function(object, keypath, callback) {
      if (!v.isString(keypath)) {
        return undefined;
      }

      var key = ""
        , i
        , escape = false;

      for (i = 0; i < keypath.length; ++i) {
        switch (keypath[i]) {
          case '.':
            if (escape) {
              escape = false;
              key += '.';
            } else {
              object = callback(object, key, false);
              key = "";
            }
            break;

          case '\\':
            if (escape) {
              escape = false;
              key += '\\';
            } else {
              escape = true;
            }
            break;

          default:
            escape = false;
            key += keypath[i];
            break;
        }
      }

      return callback(object, key, true);
    },

    getDeepObjectValue: function(obj, keypath) {
      if (!v.isObject(obj)) {
        return undefined;
      }

      return v.forEachKeyInKeypath(obj, keypath, function(obj, key) {
        if (v.isObject(obj)) {
          return obj[key];
        }
      });
    },

    // This returns an object with all the values of the form.
    // It uses the input name as key and the value as value
    // So for example this:
    // <input type="text" name="email" value="foo@bar.com" />
    // would return:
    // {email: "foo@bar.com"}
    collectFormValues: function(form, options) {
      var values = {}
        , i
        , j
        , input
        , inputs
        , option
        , value;

      if (v.isJqueryElement(form)) {
        form = form[0];
      }

      if (!form) {
        return values;
      }

      options = options || {};

      inputs = form.querySelectorAll("input[name], textarea[name]");
      for (i = 0; i < inputs.length; ++i) {
        input = inputs.item(i);

        if (v.isDefined(input.getAttribute("data-ignored"))) {
          continue;
        }

        name = input.name.replace(/\./g, "\\\\.");
        value = v.sanitizeFormValue(input.value, options);
        if (input.type === "number") {
          value = value ? +value : null;
        } else if (input.type === "checkbox") {
          if (input.attributes.value) {
            if (!input.checked) {
              value = values[name] || null;
            }
          } else {
            value = input.checked;
          }
        } else if (input.type === "radio") {
          if (!input.checked) {
            value = values[name] || null;
          }
        }
        values[name] = value;
      }

      inputs = form.querySelectorAll("select[name]");
      for (i = 0; i < inputs.length; ++i) {
        input = inputs.item(i);
        if (v.isDefined(input.getAttribute("data-ignored"))) {
          continue;
        }

        if (input.multiple) {
          value = [];
          for (j in input.options) {
            option = input.options[j];
             if (option && option.selected) {
              value.push(v.sanitizeFormValue(option.value, options));
            }
          }
        } else {
          var _val = typeof input.options[input.selectedIndex] !== 'undefined' ? input.options[input.selectedIndex].value : '';
          value = v.sanitizeFormValue(_val, options);
        }
        values[input.name] = value;
      }

      return values;
    },

    sanitizeFormValue: function(value, options) {
      if (options.trim && v.isString(value)) {
        value = value.trim();
      }

      if (options.nullify !== false && value === "") {
        return null;
      }
      return value;
    },

    capitalize: function(str) {
      if (!v.isString(str)) {
        return str;
      }
      return str[0].toUpperCase() + str.slice(1);
    },

    // Remove all errors who's error attribute is empty (null or undefined)
    pruneEmptyErrors: function(errors) {
      return errors.filter(function(error) {
        return !v.isEmpty(error.error);
      });
    },

    // In
    // [{error: ["err1", "err2"], ...}]
    // Out
    // [{error: "err1", ...}, {error: "err2", ...}]
    //
    // All attributes in an error with multiple messages are duplicated
    // when expanding the errors.
    expandMultipleErrors: function(errors) {
      var ret = [];
      errors.forEach(function(error) {
        // Removes errors without a message
        if (v.isArray(error.error)) {
          error.error.forEach(function(msg) {
            ret.push(v.extend({}, error, {error: msg}));
          });
        } else {
          ret.push(error);
        }
      });
      return ret;
    },

    // Converts the error mesages by prepending the attribute name unless the
    // message is prefixed by ^
    convertErrorMessages: function(errors, options) {
      options = options || {};

      var ret = []
        , prettify = options.prettify || v.prettify;
      errors.forEach(function(errorInfo) {
        var error = v.result(errorInfo.error,
            errorInfo.value,
            errorInfo.attribute,
            errorInfo.options,
            errorInfo.attributes,
            errorInfo.globalOptions);

        if (!v.isString(error)) {
          ret.push(errorInfo);
          return;
        }

        if (error[0] === '^') {
          error = error.slice(1);
        } else if (options.fullMessages !== false) {
          error = v.capitalize(prettify(errorInfo.attribute)) + " " + error;
        }
        error = error.replace(/\\\^/g, "^");
        error = v.format(error, {
          value: v.stringifyValue(errorInfo.value, options)
        });
        ret.push(v.extend({}, errorInfo, {error: error}));
      });
      return ret;
    },

    // In:
    // [{attribute: "<attributeName>", ...}]
    // Out:
    // {"<attributeName>": [{attribute: "<attributeName>", ...}]}
    groupErrorsByAttribute: function(errors) {
      var ret = {};
      errors.forEach(function(error) {
        var list = ret[error.attribute];
        if (list) {
          list.push(error);
        } else {
          ret[error.attribute] = [error];
        }
      });
      return ret;
    },

    // In:
    // [{error: "<message 1>", ...}, {error: "<message 2>", ...}]
    // Out:
    // ["<message 1>", "<message 2>"]
    flattenErrorsToArray: function(errors) {
      return errors
        .map(function(error) { return error.error; })
        .filter(function(value, index, self) {
          return self.indexOf(value) === index;
        });
    },

    cleanAttributes: function(attributes, whitelist) {
      function whitelistCreator(obj, key, last) {
        if (v.isObject(obj[key])) {
          return obj[key];
        }
        return (obj[key] = last ? true : {});
      }

      function buildObjectWhitelist(whitelist) {
        var ow = {}
          , attr;
        for (attr in whitelist) {
          if (!whitelist[attr]) {
            continue;
          }
          v.forEachKeyInKeypath(ow, attr, whitelistCreator);
        }
        return ow;
      }

      function cleanRecursive(attributes, whitelist) {
        if (!v.isObject(attributes)) {
          return attributes;
        }

        var ret = v.extend({}, attributes)
          , w
          , attribute;

        for (attribute in attributes) {
          w = whitelist[attribute];

          if (v.isObject(w)) {
            ret[attribute] = cleanRecursive(ret[attribute], w);
          } else if (!w) {
            delete ret[attribute];
          }
        }
        return ret;
      }

      if (!v.isObject(whitelist) || !v.isObject(attributes)) {
        return {};
      }

      whitelist = buildObjectWhitelist(whitelist);
      return cleanRecursive(attributes, whitelist);
    },

    exposeModule: function(validate, root, exports, module, define) {
      if (exports) {
        if (module && module.exports) {
          exports = module.exports = validate;
        }
        exports.validate = validate;
      } else {
        root.validate = validate;
        if (validate.isFunction(define) && define.amd) {
          define([], function () { return validate; });
        }
      }
    },

    warn: function(msg) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("[validate.js] " + msg);
      }
    },

    error: function(msg) {
      if (typeof console !== "undefined" && console.error) {
        console.error("[validate.js] " + msg);
      }
    }
  });

  validate.validators = {
    // Presence validates that the value isn't empty
    presence: function(value, options) {
      options = v.extend({}, this.options, options);
      if (options.allowEmpty !== false ? !v.isDefined(value) : v.isEmpty(value)) {
        return options.message || this.message || "can't be blank";
      }
    },
    length: function(value, options, attribute) {
      // Empty values are allowed
      if (!v.isDefined(value)) {
        return;
      }

      options = v.extend({}, this.options, options);

      var is = options.is
        , maximum = options.maximum
        , minimum = options.minimum
        , tokenizer = options.tokenizer || function(val) { return val; }
        , err
        , errors = [];

      value = tokenizer(value);
      var length = value.length;
      if(!v.isNumber(length)) {
        v.error(v.format("Attribute %{attr} has a non numeric value for `length`", {attr: attribute}));
        return options.message || this.notValid || "has an incorrect length";
      }

      // Is checks
      if (v.isNumber(is) && length !== is) {
        err = options.wrongLength ||
          this.wrongLength ||
          "is the wrong length (should be %{count} characters)";
        errors.push(v.format(err, {count: is}));
      }

      if (v.isNumber(minimum) && length < minimum) {
        err = options.tooShort ||
          this.tooShort ||
          "is too short (minimum is %{count} characters)";
        errors.push(v.format(err, {count: minimum}));
      }

      if (v.isNumber(maximum) && length > maximum) {
        err = options.tooLong ||
          this.tooLong ||
          "is too long (maximum is %{count} characters)";
        errors.push(v.format(err, {count: maximum}));
      }

      if (errors.length > 0) {
        return options.message || errors;
      }
    },
    numericality: function(value, options, attribute, attributes, globalOptions) {
      // Empty values are fine
      if (!v.isDefined(value)) {
        return;
      }

      options = v.extend({}, this.options, options);

      var errors = []
        , name
        , count
        , checks = {
            greaterThan:          function(v, c) { return v > c; },
            greaterThanOrEqualTo: function(v, c) { return v >= c; },
            equalTo:              function(v, c) { return v === c; },
            lessThan:             function(v, c) { return v < c; },
            lessThanOrEqualTo:    function(v, c) { return v <= c; },
            divisibleBy:          function(v, c) { return v % c === 0; }
          }
        , prettify = options.prettify ||
          (globalOptions && globalOptions.prettify) ||
          v.prettify;

      // Strict will check that it is a valid looking number
      if (v.isString(value) && options.strict) {
        var pattern = "^-?(0|[1-9]\\d*)";
        if (!options.onlyInteger) {
          pattern += "(\\.\\d+)?";
        }
        pattern += "$";

        if (!(new RegExp(pattern).test(value))) {
          return options.message ||
            options.notValid ||
            this.notValid ||
            this.message ||
            "must be a valid number";
        }
      }

      // Coerce the value to a number unless we're being strict.
      if (options.noStrings !== true && v.isString(value) && !v.isEmpty(value)) {
        value = +value;
      }

      // If it's not a number we shouldn't continue since it will compare it.
      if (!v.isNumber(value)) {
        return options.message ||
          options.notValid ||
          this.notValid ||
          this.message ||
          "is not a number";
      }

      // Same logic as above, sort of. Don't bother with comparisons if this
      // doesn't pass.
      if (options.onlyInteger && !v.isInteger(value)) {
        return options.message ||
          options.notInteger ||
          this.notInteger ||
          this.message ||
          "must be an integer";
      }

      for (name in checks) {
        count = options[name];
        if (v.isNumber(count) && !checks[name](value, count)) {
          // This picks the default message if specified
          // For example the greaterThan check uses the message from
          // this.notGreaterThan so we capitalize the name and prepend "not"
          var key = "not" + v.capitalize(name);
          var msg = options[key] ||
            this[key] ||
            this.message ||
            "must be %{type} %{count}";

          errors.push(v.format(msg, {
            count: count,
            type: prettify(name)
          }));
        }
      }

      if (options.odd && value % 2 !== 1) {
        errors.push(options.notOdd ||
            this.notOdd ||
            this.message ||
            "must be odd");
      }
      if (options.even && value % 2 !== 0) {
        errors.push(options.notEven ||
            this.notEven ||
            this.message ||
            "must be even");
      }

      if (errors.length) {
        return options.message || errors;
      }
    },
    datetime: v.extend(function(value, options) {
      if (!v.isFunction(this.parse) || !v.isFunction(this.format)) {
        throw new Error("Both the parse and format functions needs to be set to use the datetime/date validator");
      }

      // Empty values are fine
      if (!v.isDefined(value)) {
        return;
      }

      options = v.extend({}, this.options, options);

      var err
        , errors = []
        , earliest = options.earliest ? this.parse(options.earliest, options) : NaN
        , latest = options.latest ? this.parse(options.latest, options) : NaN;

      value = this.parse(value, options);

      // 86400000 is the number of milliseconds in a day, this is used to remove
      // the time from the date
      if (isNaN(value) || options.dateOnly && value % 86400000 !== 0) {
        err = options.notValid ||
          options.message ||
          this.notValid ||
          "must be a valid date";
        return v.format(err, {value: arguments[0]});
      }

      if (!isNaN(earliest) && value < earliest) {
        err = options.tooEarly ||
          options.message ||
          this.tooEarly ||
          "must be no earlier than %{date}";
        err = v.format(err, {
          value: this.format(value, options),
          date: this.format(earliest, options)
        });
        errors.push(err);
      }

      if (!isNaN(latest) && value > latest) {
        err = options.tooLate ||
          options.message ||
          this.tooLate ||
          "must be no later than %{date}";
        err = v.format(err, {
          date: this.format(latest, options),
          value: this.format(value, options)
        });
        errors.push(err);
      }

      if (errors.length) {
        return v.unique(errors);
      }
    }, {
      parse: null,
      format: null
    }),
    date: function(value, options) {
      options = v.extend({}, options, {dateOnly: true});
      return v.validators.datetime.call(v.validators.datetime, value, options);
    },
    format: function(value, options) {
      if (v.isString(options) || (options instanceof RegExp)) {
        options = {pattern: options};
      }

      options = v.extend({}, this.options, options);

      var message = options.message || this.message || "is invalid"
        , pattern = options.pattern
        , match;

      // Empty values are allowed
      if (!v.isDefined(value)) {
        return;
      }
      if (!v.isString(value)) {
        return message;
      }

      if (v.isString(pattern)) {
        pattern = new RegExp(options.pattern, options.flags);
      }
      match = pattern.exec(value);
      if (!match || match[0].length != value.length) {
        return message;
      }
    },
    inclusion: function(value, options) {
      // Empty values are fine
      if (!v.isDefined(value)) {
        return;
      }
      if (v.isArray(options)) {
        options = {within: options};
      }
      options = v.extend({}, this.options, options);
      if (v.contains(options.within, value)) {
        return;
      }
      var message = options.message ||
        this.message ||
        "^%{value} is not included in the list";
      return v.format(message, {value: value});
    },
    exclusion: function(value, options) {
      // Empty values are fine
      if (!v.isDefined(value)) {
        return;
      }
      if (v.isArray(options)) {
        options = {within: options};
      }
      options = v.extend({}, this.options, options);
      if (!v.contains(options.within, value)) {
        return;
      }
      var message = options.message || this.message || "^%{value} is restricted";
      return v.format(message, {value: value});
    },
    email: v.extend(function(value, options) {
      options = v.extend({}, this.options, options);
      var message = options.message || this.message || "is not a valid email";
      // Empty values are fine
      if (!v.isDefined(value)) {
        return;
      }
      if (!v.isString(value)) {
        return message;
      }
      if (!this.PATTERN.exec(value)) {
        return message;
      }
    }, {
      PATTERN: /^[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i
    }),
    equality: function(value, options, attribute, attributes, globalOptions) {
      if (!v.isDefined(value)) {
        return;
      }

      if (v.isString(options)) {
        options = {attribute: options};
      }
      options = v.extend({}, this.options, options);
      var message = options.message ||
        this.message ||
        "is not equal to %{attribute}";

      if (v.isEmpty(options.attribute) || !v.isString(options.attribute)) {
        throw new Error("The attribute must be a non empty string");
      }

      var otherValue = v.getDeepObjectValue(attributes, options.attribute)
        , comparator = options.comparator || function(v1, v2) {
          return v1 === v2;
        }
        , prettify = options.prettify ||
          (globalOptions && globalOptions.prettify) ||
          v.prettify;

      if (!comparator(value, otherValue, options, attribute, attributes)) {
        return v.format(message, {attribute: prettify(options.attribute)});
      }
    },

    // A URL validator that is used to validate URLs with the ability to
    // restrict schemes and some domains.
    url: function(value, options) {
      if (!v.isDefined(value)) {
        return;
      }

      options = v.extend({}, this.options, options);

      var message = options.message || this.message || "is not a valid url"
        , schemes = options.schemes || this.schemes || ['http', 'https']
        , allowLocal = options.allowLocal || this.allowLocal || false;

      if (!v.isString(value)) {
        return message;
      }

      // https://gist.github.com/dperini/729294
      var regex =
        "^" +
        // protocol identifier
        "(?:(?:" + schemes.join("|") + ")://)" +
        // user:pass authentication
        "(?:\\S+(?::\\S*)?@)?" +
        "(?:";

      var tld = "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))";

      if (allowLocal) {
        tld += "?";
      } else {
        regex +=
          // IP address exclusion
          // private & local networks
          "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
          "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
          "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})";
      }

      regex +=
          // IP address dotted notation octets
          // excludes loopback network 0.0.0.0
          // excludes reserved space >= 224.0.0.0
          // excludes network & broacast addresses
          // (first & last IP address of each class)
          "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
          "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
          "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
        "|" +
          // host name
          "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" +
          // domain name
          "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
          tld +
        ")" +
        // port number
        "(?::\\d{2,5})?" +
        // resource path
        "(?:[/?#]\\S*)?" +
      "$";

      var PATTERN = new RegExp(regex, 'i');
      if (!PATTERN.exec(value)) {
        return message;
      }
    }
  };

  validate.formatters = {
    detailed: function(errors) {return errors;},
    flat: v.flattenErrorsToArray,
    grouped: function(errors) {
      var attr;

      errors = v.groupErrorsByAttribute(errors);
      for (attr in errors) {
        errors[attr] = v.flattenErrorsToArray(errors[attr]);
      }
      return errors;
    },
    constraint: function(errors) {
      var attr;
      errors = v.groupErrorsByAttribute(errors);
      for (attr in errors) {
        errors[attr] = errors[attr].map(function(result) {
          return result.validator;
        }).sort();
      }
      return errors;
    }
  };

  validate.exposeModule(validate, this, exports, module, define);
}).call(commonjsGlobal,
        exports,
        module,
        null);
});

validate.validators.equals = function (value, options, key, attributes) {
  if (options && value !== options.value) {
    return key + 'must equal ' + options.value;
  }
};

validate.validators.doesNotEqual = function (value, options, key) {
  if (options && value === options.value) {
    return key + 'cannot equal ' + options.value;
  }
};

validate.validators.contains = function (value, options, key) {
  if (options && value.indexOf && value.indexOf(options.value) === -1) {
    return key + 'must contain ' + options.value;
  }
};

validate.validators.doesNotContain = function (value, options, key) {
  if (options && value.indexOf && value.indexOf(options.value) !== -1) {
    return key + 'cannot contain ' + options.value;
  }
};

validate.validators.startsWith = function (value, options, key) {
  if (options && value.startsWith && !value.startsWith(options.value)) {
    return key + 'must start with ' + options.value;
  }
};

validate.validators.endsWith = function (value, options, key) {
  if (options && value.endsWith && !value.endsWith(options.value)) {
    return key + 'must end with ' + options.value;
  }
};

/**
 * Import Constants
 */

var StudySummary = metadata.StudySummary,
    InstanceMetadata$1 = metadata.InstanceMetadata;
/**
 * Match a Metadata instance against rules using Validate.js for validation.
 * @param  {StudySummary|InstanceMetadata} metadataInstance Metadata instance object
 * @param  {Array} rules Array of MatchingRules instances (StudyMatchingRule|SeriesMatchingRule|ImageMatchingRule) for the match
 * @return {Object}      Matching Object with score and details (which rule passed or failed)
 */

var match = function match(metadataInstance, rules) {
  // Make sure the supplied data is valid.
  if (!(metadataInstance instanceof StudySummary || metadataInstance instanceof InstanceMetadata$1)) {
    throw new OHIFError('HPMatcher::match metadataInstance must be an instance of StudySummary or InstanceMetadata');
  }

  var options = {
    format: 'grouped'
  };
  var details = {
    passed: [],
    failed: []
  };
  var requiredFailed = false;
  var score = 0;
  rules.forEach(function (rule) {
    var attribute = rule.attribute;
    var customAttributeExists = metadataInstance.customAttributeExists(attribute); // If the metadataInstance we are testing (e.g. study, series, or instance MetadataInstance) do
    // not contain the attribute specified in the rule, check whether or not they have been
    // defined in the CustomAttributeRetrievalCallbacks Object.

    if (!customAttributeExists && HP.CustomAttributeRetrievalCallbacks.hasOwnProperty(attribute)) {
      var customAttribute = HP.CustomAttributeRetrievalCallbacks[attribute];
      metadataInstance.setCustomAttribute(attribute, customAttribute.callback(metadataInstance));
      customAttributeExists = true;
    } // Format the constraint as required by Validate.js


    var testConstraint = babelHelpers.defineProperty({}, attribute, rule.constraint); // Create a single attribute object to be validated, since metadataInstance is an
    // instance of Metadata (StudyMetadata, SeriesMetadata or InstanceMetadata)

    var attributeValue = customAttributeExists ? metadataInstance.getCustomAttribute(attribute) : metadataInstance.getTagValue(attribute);
    var attributeMap = babelHelpers.defineProperty({}, attribute, attributeValue); // Use Validate.js to evaluate the constraints on the specified metadataInstance

    var errorMessages;

    try {
      errorMessages = validate(attributeMap, testConstraint, [options]);
    } catch (e) {
      errorMessages = ['Something went wrong during validation.', e];
    }

    if (!errorMessages) {
      // If no errorMessages were returned, then validation passed.
      // Add the rule's weight to the total score
      score += parseInt(rule.weight, 10); // Log that this rule passed in the matching details object

      details.passed.push({
        rule: rule
      });
    } else {
      // If errorMessages were present, then validation failed
      // If the rule that failed validation was Required, then
      // mark that a required Rule has failed
      if (rule.required) {
        requiredFailed = true;
      } // Log that this rule failed in the matching details object
      // and include any error messages


      details.failed.push({
        rule: rule,
        errorMessages: errorMessages
      });
    }
  }); // If a required Rule has failed Validation, set the matching score to zero

  if (requiredFailed) {
    score = 0;
  }

  return {
    score: score,
    details: details,
    requiredFailed: requiredFailed
  };
};

var HPMatcher = {
  match: match
};

// Sorts an array by score
var sortByScore = function sortByScore(arr) {
  arr.sort(function (a, b) {
    return b.score - a.score;
  });
};

/**
 * Import Constants
 */

var StudyMetadata$1 = metadata.StudyMetadata,
    InstanceMetadata$2 = metadata.InstanceMetadata,
    StudySummary$1 = metadata.StudySummary;


var ABSTRACT_PRIOR_VALUE = 'abstractPriorValue';
/*Meteor.startup(() => {
    HP.addCustomViewportSetting('wlPreset', 'Window/Level Preset', Object.create(null), (element, optionValue) => {
        if (_.findWhere(OHIF.viewer.wlPresets, { id: optionValue })) {
            OHIF.viewerbase.wlPresets.applyWLPreset(optionValue, element);
        }
    });
});*/
// TODO:
// Should have ProtocolStore as an input to constructor
// Something to update current HP and current stage 'globally'
//
//
// Should allow user to provide:
// functions for adding /

var ProtocolEngine =
/*#__PURE__*/
function () {
  /**
   * Constructor
   * @param  {Array} studies        Array of study metadata
   * @param  {Map} priorStudies Map of prior studies
   * @param  {Object} studyMetadataSource Instance of StudyMetadataSource (ohif-viewerbase) Object to get study metadata
   */
  function ProtocolEngine(studies, priorStudies, studyMetadataSource) {
    babelHelpers.classCallCheck(this, ProtocolEngine);
    babelHelpers.defineProperty(this, "matchedProtocols", new Set());
    babelHelpers.defineProperty(this, "matchedProtocolScores", new Map());

    // -----------
    // Type Validations
    if (!(studyMetadataSource instanceof StudyMetadataSource)) {
      throw new OHIFError('ProtocolEngine::constructor studyMetadataSource is not an instance of StudyMetadataSource');
    }

    if (!(studies instanceof Array) && !studies.every(function (study) {
      return study instanceof StudyMetadata$1;
    })) {
      throw new OHIFError("ProtocolEngine::constructor studies is not an array or it's items are not instances of StudyMetadata");
    } // --------------
    // Initialization


    this.studies = studies;
    this.priorStudies = priorStudies instanceof Map ? priorStudies : new Map();
    this.studyMetadataSource = studyMetadataSource; // Put protocol engine in a known state

    this.reset(); // Create an array for new stage ids to be stored
    // while editing a stage

    this.newStageIds = [];
  }
  /**
   * Resets the ProtocolEngine to the best match
   */


  babelHelpers.createClass(ProtocolEngine, [{
    key: "reset",
    value: function reset() {
      var protocol = this.getBestProtocolMatch();
      this.setHangingProtocol(protocol);
    }
    /**
     * Retrieves the current Stage from the current Protocol and stage index
     *
     * @returns {*} The Stage model for the currently displayed Stage
     */

  }, {
    key: "getCurrentStageModel",
    value: function getCurrentStageModel() {
      return this.protocol.stages[this.stage];
    }
    /**
     * Finds the best protocols from Protocol Store, matching each protocol matching rules
     * with the given study. The best protocol are orded by score and returned in an array
     * @param  {Object} study StudyMetadata instance object
     * @return {Array}       Array of match objects or an empty array if no match was found
     *                       Each match object has the score of the matching and the matched
     *                       protocol
     */

  }, {
    key: "findMatchByStudy",
    value: function findMatchByStudy(study) {
      log$1.trace('ProtocolEngine::findMatchByStudy');
      var matched = [];
      var studyInstance = study.getFirstInstance(); // Set custom attribute for study metadata

      var numberOfAvailablePriors = this.getNumberOfAvailablePriors(study.getObjectID());
      HP.ProtocolStore.getProtocol().forEach(function (protocol) {
        // Clone the protocol's protocolMatchingRules array
        // We clone it so that we don't accidentally add the
        // numberOfPriorsReferenced rule to the Protocol itself.
        var rules = protocol.protocolMatchingRules.slice();

        if (!rules) {
          return;
        } // Check if the study has the minimun number of priors used by the protocol.


        var numberOfPriorsReferenced = protocol.getNumberOfPriorsReferenced();

        if (numberOfPriorsReferenced > numberOfAvailablePriors) {
          return;
        } // Run the matcher and get matching details


        var matchedDetails = HPMatcher.match(studyInstance, rules);
        var score = matchedDetails.score; // The protocol matched some rule, add it to the matched list

        if (score > 0) {
          matched.push({
            score: score,
            protocol: protocol
          });
        }
      }); // If no matches were found, select the default protocol

      if (!matched.length) {
        var defaultProtocol = HP.ProtocolStore.getProtocol('defaultProtocol');
        return [{
          score: 1,
          protocol: defaultProtocol
        }];
      } // Sort the matched list by score


      sortByScore(matched);
      log$1.trace('ProtocolEngine::findMatchByStudy matched', matched);
      return matched;
    }
  }, {
    key: "_clearMatchedProtocols",
    value: function _clearMatchedProtocols() {
      this.matchedProtocols.clear();
      this.matchedProtocolScores.clear();
    }
    /**
     * Populates the MatchedProtocols Collection by running the matching procedure
     */

  }, {
    key: "updateProtocolMatches",
    value: function updateProtocolMatches() {
      var _this = this;

      log$1.trace('ProtocolEngine::updateProtocolMatches'); // Clear all data currently in matchedProtocols

      this._clearMatchedProtocols(); // For each study, find the matching protocols


      this.studies.forEach(function (study) {
        var matched = _this.findMatchByStudy(study); // For each matched protocol, check if it is already in MatchedProtocols


        matched.forEach(function (matchedDetail) {
          var protocol = matchedDetail.protocol;

          if (!protocol) {
            return;
          } // If it is not already in the MatchedProtocols Collection, insert it with its score


          if (!_this.matchedProtocols.has(protocol)) {
            log$1.trace('ProtocolEngine::updateProtocolMatches inserting protocol match', matchedDetail);

            _this.matchedProtocols.add(protocol);

            _this.matchedProtocolScores[protocol.id] = matchedDetail.score;
          }
        });
      });
    }
  }, {
    key: "_getHighestScoringProtocol",
    value: function _getHighestScoringProtocol() {
      var highestScoringProtocolId = ProtocolEngine._largestKeyByValue(this.matchedProtocolScores);

      return this.matchedProtocols[highestScoringProtocolId];
    }
    /**
     * Return the best matched Protocol to the current study or set of studies
     * @returns {*}
     */

  }, {
    key: "getBestProtocolMatch",
    value: function getBestProtocolMatch() {
      // Run the matching to populate matchedProtocols Set and Map
      this.updateProtocolMatches(); // Retrieve the highest scoring Protocol

      var bestMatch = this._getHighestScoringProtocol();

      log$1.trace('ProtocolEngine::getBestProtocolMatch bestMatch', bestMatch);
      return bestMatch;
    }
    /**
     * Get the number of prior studies supplied in the priorStudies map property.
     *
     * @param {String} studyObjectID The study object ID of the study whose priors are needed
     * @returns {number} The number of available prior studies with the same PatientID
     */

  }, {
    key: "getNumberOfAvailablePriors",
    value: function getNumberOfAvailablePriors(studyObjectID) {
      return this.getAvailableStudyPriors(studyObjectID).length;
    }
    /**
     * Get the array of prior studies from a specific study.
     *
     * @param {String} studyObjectID The study object ID of the study whose priors are needed
     * @returns {Array} The array of available priors or an empty array
     */

  }, {
    key: "getAvailableStudyPriors",
    value: function getAvailableStudyPriors(studyObjectID) {
      var priors = this.priorStudies.get(studyObjectID);
      return priors instanceof Array ? priors : [];
    } // Match images given a list of Studies and a Viewport's image matching reqs

  }, {
    key: "matchImages",
    value: function matchImages(viewport, viewportIndex) {
      var _this2 = this;

      log$1.trace('ProtocolEngine::matchImages');
      var studyMatchingRules = viewport.studyMatchingRules,
          seriesMatchingRules = viewport.seriesMatchingRules,
          instanceMatchingRules = viewport.imageMatchingRules;
      var matchingScores = [];
      var currentStudy = this.studies[0]; // @TODO: Should this be: this.studies[this.currentStudy] ???

      var firstInstance = currentStudy.getFirstInstance();
      var highestStudyMatchingScore = 0;
      var highestSeriesMatchingScore = 0; // Set custom attribute for study metadata and it's first instance

      currentStudy.setCustomAttribute(ABSTRACT_PRIOR_VALUE, 0);

      if (firstInstance instanceof InstanceMetadata$2) {
        firstInstance.setCustomAttribute(ABSTRACT_PRIOR_VALUE, 0);
      } // Only used if study matching rules has abstract prior values defined...


      var priorStudies;
      studyMatchingRules.forEach(function (rule) {
        if (rule.attribute === ABSTRACT_PRIOR_VALUE) {
          var validatorType = Object.keys(rule.constraint)[0];
          var validator = Object.keys(rule.constraint[validatorType])[0];
          var abstractPriorValue = rule.constraint[validatorType][validator];
          abstractPriorValue = parseInt(abstractPriorValue, 10); // TODO: Restrict or clarify validators for abstractPriorValue?
          // No need to call it more than once...

          if (!priorStudies) {
            priorStudies = _this2.getAvailableStudyPriors(currentStudy.getObjectID());
          } // TODO: Revisit this later: What about two studies with the same
          // study date?


          var priorStudy;

          if (abstractPriorValue === -1) {
            priorStudy = priorStudies[priorStudies.length - 1];
          } else {
            var studyIndex = Math.max(abstractPriorValue - 1, 0);
            priorStudy = priorStudies[studyIndex];
          } // Invalid data


          if (!(priorStudy instanceof StudyMetadata$1) && !(priorStudy instanceof StudySummary$1)) {
            return;
          }

          var priorStudyObjectID = priorStudy.getObjectID(); // Check if study metadata is already in studies list

          if (_this2.studies.find(function (study) {
            return study.getObjectID() === priorStudyObjectID;
          })) {
            return;
          } // Get study metadata if necessary and load study in the viewer (each viewer should provide it's own load study method)


          _this2.studyMetadataSource.loadStudy(priorStudy).then(function (studyMetadata) {
            // Set the custom attribute abstractPriorValue for the study metadata
            studyMetadata.setCustomAttribute(ABSTRACT_PRIOR_VALUE, abstractPriorValue); // Also add custom attribute

            var firstInstance = studyMetadata.getFirstInstance();

            if (firstInstance instanceof InstanceMetadata$2) {
              firstInstance.setCustomAttribute(ABSTRACT_PRIOR_VALUE, abstractPriorValue);
            } // Insert the new study metadata


            _this2.studies.push(studyMetadata); // Update the viewport to refresh layout manager with new study


            _this2.updateViewports(viewportIndex);
          }, function (error) {
            log$1.warn(error);
            throw new OHIFError("ProtocolEngine::matchImages could not get study metadata for the Study with the following ObjectID: ".concat(priorStudyObjectID));
          });
        } // TODO: Add relative Date / time

      });
      this.studies.forEach(function (study) {
        var studyMatchDetails = HPMatcher.match(study.getFirstInstance(), studyMatchingRules); // Prevent bestMatch from being updated if the matchDetails' required attribute check has failed

        if (studyMatchDetails.requiredFailed === true || studyMatchDetails.score < highestStudyMatchingScore) {
          return;
        }

        highestStudyMatchingScore = studyMatchDetails.score;
        study.forEachSeries(function (series) {
          var seriesMatchDetails = HPMatcher.match(series.getFirstInstance(), seriesMatchingRules); // Prevent bestMatch from being updated if the matchDetails' required attribute check has failed

          if (seriesMatchDetails.requiredFailed === true || seriesMatchDetails.score < highestSeriesMatchingScore) {
            return;
          }

          highestSeriesMatchingScore = seriesMatchDetails.score;
          series.forEachInstance(function (instance, index) {
            // This tests to make sure there is actually image data in this instance
            // TODO: Change this when we add PDF and MPEG support
            // See https://ohiforg.atlassian.net/browse/LT-227
            // sopClassUid = x00080016
            // rows = x00280010
            if (!isImage(instance.getTagValue('x00080016')) && !instance.getTagValue('x00280010')) {
              return;
            }

            var instanceMatchDetails = HPMatcher.match(instance, instanceMatchingRules); // Prevent bestMatch from being updated if the matchDetails' required attribute check has failed

            if (instanceMatchDetails.requiredFailed === true) {
              return;
            }

            var matchDetails = {
              passed: [],
              failed: []
            };
            matchDetails.passed = matchDetails.passed.concat(instanceMatchDetails.details.passed);
            matchDetails.passed = matchDetails.passed.concat(seriesMatchDetails.details.passed);
            matchDetails.passed = matchDetails.passed.concat(studyMatchDetails.details.passed);
            matchDetails.failed = matchDetails.failed.concat(instanceMatchDetails.details.failed);
            matchDetails.failed = matchDetails.failed.concat(seriesMatchDetails.details.failed);
            matchDetails.failed = matchDetails.failed.concat(studyMatchDetails.details.failed);
            var totalMatchScore = instanceMatchDetails.score + seriesMatchDetails.score + studyMatchDetails.score;
            var currentSOPInstanceUID = instance.getSOPInstanceUID();
            var imageDetails = {
              studyInstanceUid: study.getStudyInstanceUID(),
              seriesInstanceUid: series.getSeriesInstanceUID(),
              sopInstanceUid: currentSOPInstanceUID,
              currentImageIdIndex: index,
              matchingScore: totalMatchScore,
              matchDetails: matchDetails,
              sortingInfo: {
                score: totalMatchScore,
                study: instance.getTagValue('x00080020') + instance.getTagValue('x00080030'),
                // StudyDate = x00080020 StudyTime = x00080030
                series: parseInt(instance.getTagValue('x00200011')),
                // TODO: change for seriesDateTime SeriesNumber = x00200011
                instance: parseInt(instance.getTagValue('x00200013')) // TODO: change for acquisitionTime InstanceNumber = x00200013

              }
            }; // Find the displaySet

            var displaySet = study.findDisplaySet(function (displaySet) {
              return displaySet.images.find(function (image) {
                return image.getSOPInstanceUID() === currentSOPInstanceUID;
              });
            }); // If the instance was found, set the displaySet ID

            if (displaySet) {
              imageDetails.displaySetInstanceUid = displaySet.getUID();
              imageDetails.imageId = instance.getImageId();
            }

            matchingScores.push(imageDetails);
          });
        });
      }); // Sort the matchingScores

      var sortingFunction = sortBy({
        name: 'score',
        reverse: true
      }, {
        name: 'study',
        reverse: true
      }, {
        name: 'instance'
      }, {
        name: 'series'
      });
      matchingScores.sort(function (a, b) {
        return sortingFunction(a.sortingInfo, b.sortingInfo);
      });
      var bestMatch = matchingScores[0];
      log$1.trace('ProtocolEngine::matchImages bestMatch', bestMatch);
      return {
        bestMatch: bestMatch,
        matchingScores: matchingScores
      };
    }
    /**
     * Rerenders viewports that are part of the current ProtocolEngine's LayoutManager
     * using the matching rules internal to each viewport.
     *
     * If this function is provided the index of a viewport, only the specified viewport
     * is rerendered.
     *
     * @param viewportIndex
     */

  }, {
    key: "updateViewports",
    value: function updateViewports(viewportIndex) {
      var _this3 = this;

      log$1.trace("ProtocolEngine::updateViewports viewportIndex: ".concat(viewportIndex)); // Make sure we have an active protocol with a non-empty array of display sets

      if (!this.getNumProtocolStages()) {
        return;
      } // Retrieve the current stage


      var stageModel = this.getCurrentStageModel(); // If the current stage does not fulfill the requirements to be displayed,
      // stop here.

      if (!stageModel || !stageModel.viewportStructure || !stageModel.viewports || !stageModel.viewports.length) {
        return;
      } // Retrieve the layoutTemplate associated with the current display set's viewport structure
      // If no such template name exists, stop here.


      var layoutTemplateName = stageModel.viewportStructure.getLayoutTemplateName();

      if (!layoutTemplateName) {
        return;
      } // Retrieve the properties associated with the current display set's viewport structure template
      // If no such layout properties exist, stop here.


      var layoutProps = stageModel.viewportStructure.properties;

      if (!layoutProps) {
        return;
      } // Create an empty array to store the output viewportData


      var viewportData = []; // Empty the matchDetails associated with the ProtocolEngine.
      // This will be used to store the pass/fail details and score
      // for each of the viewport matching procedures

      this.matchDetails = []; // Loop through each viewport

      stageModel.viewports.forEach(function (viewport, viewportIndex) {
        var details = _this3.matchImages(viewport, viewportIndex);

        _this3.matchDetails[viewportIndex] = details; // Convert any YES/NO values into true/false for Cornerstone

        var cornerstoneViewportParams = {}; // Cache viewportSettings keys

        var viewportSettingsKeys = Object.keys(viewport.viewportSettings);
        viewportSettingsKeys.forEach(function (key) {
          var value = viewport.viewportSettings[key];

          if (value === 'YES') {
            value = true;
          } else if (value === 'NO') {
            value = false;
          }

          cornerstoneViewportParams[key] = value;
        }); // imageViewerViewports occasionally needs relevant layout data in order to set
        // the element style of the viewport in question

        var currentViewportData = babelHelpers.objectSpread({
          viewportIndex: viewportIndex,
          viewport: cornerstoneViewportParams
        }, layoutProps);
        var customSettings = [];
        viewportSettingsKeys.forEach(function (id) {
          var setting = HP.CustomViewportSettings[id];

          if (!setting) {
            return;
          }

          customSettings.push({
            id: id,
            value: viewport.viewportSettings[id]
          });
        });

        currentViewportData.renderedCallback = function (element) {
          //console.log('renderedCallback for ' + element.id);
          customSettings.forEach(function (customSetting) {
            log$1.trace("ProtocolEngine::currentViewportData.renderedCallback Applying custom setting: ".concat(customSetting.id));
            log$1.trace("ProtocolEngine::currentViewportData.renderedCallback with value: ".concat(customSetting.value));
            var setting = HP.CustomViewportSettings[customSetting.id];
            setting.callback(element, customSetting.value);
          });
        };

        var currentMatch = details.bestMatch;
        var currentPosition = 1;
        var scoresLength = details.matchingScores.length;

        while (currentPosition < scoresLength && viewportData.find(function (a) {
          return a.imageId === currentMatch.imageId;
        })) {
          currentMatch = details.matchingScores[currentPosition];
          currentPosition++;
        }

        if (currentMatch && currentMatch.imageId) {
          currentViewportData.studyInstanceUid = currentMatch.studyInstanceUid;
          currentViewportData.seriesInstanceUid = currentMatch.seriesInstanceUid;
          currentViewportData.sopInstanceUid = currentMatch.sopInstanceUid;
          currentViewportData.currentImageIdIndex = currentMatch.currentImageIdIndex;
          currentViewportData.displaySetInstanceUid = currentMatch.displaySetInstanceUid;
          currentViewportData.imageId = currentMatch.imageId;
        } // @TODO Why should we throw an exception when a best match is not found? This was aborting the whole process.
        // if (!currentViewportData.displaySetInstanceUid) {
        //     throw new OHIFError('ProtocolEngine::updateViewports No matching display set found?');
        // }


        viewportData.push(currentViewportData);
      });
      this.LayoutManager.layoutTemplateName = layoutTemplateName;
      this.LayoutManager.layoutProps = layoutProps;
      this.LayoutManager.viewportData = viewportData;

      if (viewportIndex !== undefined && viewportData[viewportIndex]) {
        this.LayoutManager.rerenderViewportWithNewDisplaySet(viewportIndex, viewportData[viewportIndex]);
      } else {
        this.LayoutManager.updateViewports();
      }
    }
    /**
     * Sets the current Hanging Protocol to the specified Protocol
     * An optional argument can also be used to prevent the updating of the Viewports
     *
     * @param newProtocol
     * @param updateViewports
     */

  }, {
    key: "setHangingProtocol",
    value: function setHangingProtocol(newProtocol) {
      var updateViewports = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      log$1.trace('ProtocolEngine::setHangingProtocol newProtocol', newProtocol);
      log$1.trace("ProtocolEngine::setHangingProtocol updateViewports = ".concat(updateViewports)); // Reset the array of newStageIds

      this.newStageIds = [];

      if (HP.Protocol.prototype.isPrototypeOf(newProtocol)) {
        this.protocol = newProtocol;
      } else {
        this.protocol = new HP.Protocol();
        this.protocol.fromObject(newProtocol);
      }

      this.stage = 0; // Update viewports by default

      if (updateViewports) {
        this.updateViewports();
      } //Session.set('HangingProtocolName', this.protocol.name);
      //Session.set('HangingProtocolStage', this.stage);

    }
    /**
     * Check if the next stage is available
     * @return {Boolean} True if next stage is available or false otherwise
     */

  }, {
    key: "isNextStageAvailable",
    value: function isNextStageAvailable() {
      var numberOfStages = this.getNumProtocolStages();
      return this.stage + 1 < numberOfStages;
    }
    /**
     * Check if the previous stage is available
     * @return {Boolean} True if previous stage is available or false otherwise
     */

  }, {
    key: "isPreviousStageAvailable",
    value: function isPreviousStageAvailable() {
      return this.stage - 1 >= 0;
    }
    /**
     * Changes the current stage to a new stage index in the display set sequence.
     * It checks if the next stage exists.
     *
     * @param {Integer} stageAction An integer value specifying wheater next (1) or previous (-1) stage
     * @return {Boolean} True if new stage has set or false, otherwise
     */

  }, {
    key: "setCurrentProtocolStage",
    value: function setCurrentProtocolStage(stageAction) {
      // Check if previous or next stage is available
      if (stageAction === -1 && !this.isPreviousStageAvailable()) {
        return false;
      } else if (stageAction === 1 && !this.isNextStageAvailable()) {
        return false;
      } // Sets the new stage


      this.stage += stageAction; // Log the new stage

      log$1.trace("ProtocolEngine::setCurrentProtocolStage stage = ".concat(this.stage)); // Set stage Session variable for reactivity
      //Session.set('HangingProtocolStage', this.stage);
      // Since stage has changed, we need to update the viewports
      // and redo matchings

      this.updateViewports(); // Everything went well

      return true;
    }
    /**
     * Retrieves the number of Stages in the current Protocol or
     * undefined if no protocol or stages are set
     */

  }, {
    key: "getNumProtocolStages",
    value: function getNumProtocolStages() {
      if (!this.protocol || !this.protocol.stages || !this.protocol.stages.length) {
        return;
      }

      return this.protocol.stages.length;
    }
    /**
     * Switches to the next protocol stage in the display set sequence
     */

  }, {
    key: "nextProtocolStage",
    value: function nextProtocolStage() {
      log$1.trace('ProtocolEngine::nextProtocolStage');

      if (!this.setCurrentProtocolStage(1)) {
        log$1.trace('ProtocolEngine::nextProtocolStage failed');
      }
    }
    /**
     * Switches to the previous protocol stage in the display set sequence
     */

  }, {
    key: "previousProtocolStage",
    value: function previousProtocolStage() {
      log$1.trace('ProtocolEngine::previousProtocolStage');

      if (!this.setCurrentProtocolStage(-1)) {
        log$1.trace('ProtocolEngine::previousProtocolStage failed');
      }
    }
  }]);
  return ProtocolEngine;
}();

var viewer = {};
var OHIF$1 = {
  viewer: viewer,
  utils: utils,
  studies: studies,
  redux: redux,
  classes: classes,
  metadata: metadata,
  hotkeys: hotkeys,
  hotkeysUtil: hotkeysUtil,
  header: header,
  cornerstone: cornerstone$1,
  string: string,
  ui: ui,
  user: user,
  object: object,
  commands: commands,
  log: log$1,
  external: external,
  DICOMWeb: DICOMWeb,
  plugins: plugins
};

exports.viewer = viewer;
exports.utils = utils;
exports.studies = studies;
exports.redux = redux;
exports.classes = classes;
exports.metadata = metadata;
exports.hotkeys = hotkeys;
exports.header = header;
exports.cornerstone = cornerstone$1;
exports.string = string;
exports.ui = ui;
exports.user = user;
exports.object = object;
exports.commands = commands;
exports.log = log$1;
exports.DICOMWeb = DICOMWeb;
exports.plugins = plugins;
exports.OHIF = OHIF$1;
exports.default = OHIF$1;
//# sourceMappingURL=index.js.map
