import { MeasurementApi } from '../classes';
import handleSingleMeasurementAdded from './handleSingleMeasurementAdded';
import handleChildMeasurementAdded from './handleChildMeasurementAdded';
import handleSingleMeasurementModified from './handleSingleMeasurementModified';
import handleChildMeasurementModified from './handleChildMeasurementModified';
import handleSingleMeasurementRemoved from './handleSingleMeasurementRemoved';
import handleChildMeasurementRemoved from './handleChildMeasurementRemoved';

const MeasurementHandlers = {
  handleSingleMeasurementAdded,
  handleChildMeasurementAdded,
  handleSingleMeasurementModified,
  handleChildMeasurementModified,
  handleSingleMeasurementRemoved,
  handleChildMeasurementRemoved,

  onAdded(event) {
    const eventData = event.detail;
    const { toolType } = eventData;
    const {
      toolGroupId,
      toolGroup,
      tool
    } = MeasurementApi.getToolConfiguration(toolType);
    const params = {
      eventData,
      tool,
      toolGroupId,
      toolGroup
    };

    if (!tool) return;

    if (tool.parentTool) {
      this.handleChildMeasurementAdded(params);
    } else {
      this.handleSingleMeasurementAdded(params);
    }
  },

  onModified(event) {
    const eventData = event.detail;
    const { toolType } = eventData;
    const {
      toolGroupId,
      toolGroup,
      tool
    } = MeasurementApi.getToolConfiguration(toolType);
    const params = {
      eventData,
      tool,
      toolGroupId,
      toolGroup
    };

    if (!tool) return;

    if (tool.parentTool) {
      this.handleChildMeasurementModified(params);
    } else {
      this.handleSingleMeasurementModified(params);
    }
  },

  onRemoved(event) {
    const eventData = event.detail;
    const { toolType } = eventData;
    const {
      toolGroupId,
      toolGroup,
      tool
    } = MeasurementApi.getToolConfiguration(toolType);
    const params = {
      eventData,
      tool,
      toolGroupId,
      toolGroup
    };

    if (!tool) return;

    if (tool.parentTool) {
      MeasurementHandlers.handleChildMeasurementRemoved(params);
    } else {
      MeasurementHandlers.handleSingleMeasurementRemoved(params);
    }
  }
};

export default MeasurementHandlers;
