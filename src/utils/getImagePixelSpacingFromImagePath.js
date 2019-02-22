import getImageIdForImagePath from '../measurements/lib/getImageIdForImagePath';
import cornerstone from 'cornerstone-core';

export default function(imagePath) {
  const imageId = getImageIdForImagePath(imagePath);
  const imagePlane = cornerstone.metaData.get('imagePlaneModule', imageId);

  const {
    rowPixelSpacing,
    rowImagePixelSpacing,
    columnPixelSpacing,
    colImagePixelSpacing
  } = imagePlane;

  let pixelSpacing = {};

  if (imagePlane) {
    pixelSpacing = {
      rowPixelSpacing: rowPixelSpacing || rowImagePixelSpacing,
      colPixelSpacing: columnPixelSpacing || colImagePixelSpacing
    };
  } else {
    const image = cornerstone.imageCache.getImageLoadObject(imageId);
    pixelSpacing = {
      rowPixelSpacing: image.rowPixelSpacing || 1,
      colPixelSpacing: image.columnPixelSpacing || 1
    };
  }

  return pixelSpacing;
}
