import Ajv from 'ajv';
import * as Criteria from './criteria';
import { BaseCriterion } from './criteria/BaseCriterion';

export class CriteriaEvaluator {
  /**
   * Create an instance of CriteriaEvaluator class
   *
   * Note the CriteriaEvaluator instance automatically validates the given evaluationDefinitions
   * schema and will throw an error if the definitions are invalid.
   *
   * @param {Object} evaluationDefinitions Definitions for the evaluator in a JSON format
   */
  constructor(evaluationDefinitions) {
    // Set the base criteria instances array
    this.criteria = [];

    // Compile the criteria validator
    const criteriaValidator = this.getCriteriaValidator();

    // Validate the current evaluationDefinitions for the Criteria schema
    if (!criteriaValidator(evaluationDefinitions)) {
      let message = '';

      // Iterate over the validation errors and append them to the error message
      if (criteriaValidator && criteriaValidator.errors) {
        criteriaValidator.errors.forEach(error => {
          message += `\noptions${error.dataPath} ${error.message}`;
        });
      }

      // Throw an error with the validation messages (one per line)
      throw new Error(message);
    }

    // Iterate over the definitions and instantiate the Criterion classes
    Object.keys(evaluationDefinitions).forEach(key => {
      const optionsObject = evaluationDefinitions[key];

      // Get the current Criterion class definition
      const Criterion = Criteria[`${criterionkey}Criterion`];

      // Transform the options into an array if it's a single object
      const optionsArray =
        optionsObject instanceof Array ? optionsObject : [optionsObject];

      // Iterate over each criteria options and instantiate each Criterion
      optionsArray.forEach(options =>
        this.criteria.push(new Criterion(options))
      );
    });
  }

  /**
   * Process the criteria defined on evaluationDefinitions and get the max allowed targets or max
   * targets from it
   *
   * @param {boolean} newTarget Defines wether the maximum number of targets or new targets will
   * be returned
   *
   * @return {Number} The maximum number of allowed targets/new targets
   */
  getMaxTargets(newTarget = false) {
    // TODO: Implement this logic inside the Criterion instead?
    let result;

    // Iterate over all MaxTargets criterion definitions to get the best match
    this.criteria.forEach(criterion => {
      const newTargetMatch = newTarget === Boolean(criterion.options.newTarget);
      const isMaxTarget = criterion instanceof Criteria.MaxTargetsCriterion;
      const isFiltered = typeof criterion.options.isNodal === 'boolean';

      // Go to next iteration if the current criterion definition is not a possible match
      if (!isMaxTarget || !newTargetMatch || isFiltered) {
        return;
      }

      // Get the current criterion's limit
      const { limit } = criterion.options;

      // Set the result if not yet defined
      if (!result) {
        result = limit;
      } else if (limit > result) {
        // Change the current result to this limit if greater than the last one
        result = limit;
      }
    });

    // Return the maximum number of allowed targets/new targets
    return result;
  }

  /**
   * Get the ajv compiled validator function for the given evaluationDefinitions
   *
   * @return {Function} validator that will match all the Criteria schemas with the given
   * evaluationDefinitions object
   */
  getCriteriaValidator() {
    // Return the validator if it's already compiled
    if (CriteriaEvaluator.criteriaValidator) {
      return CriteriaEvaluator.criteriaValidator;
    }

    // Define the base validation schema
    const schema = {
      properties: {},
      definitions: {}
    };

    // Iterate over all the existent criteria and attach an ajv JSON schema for the validator
    Object.keys(Criteria).forEach(key => {
      const Criterion = Criteria[key];

      // Go to the next iteration if the current Criterion is not an instance of BaseCriterion
      // This check is important to skip Schema definitions
      if (!(Criterion.prototype instanceof BaseCriterion)) {
        return;
      }

      // Define the key that will match the current Criterion in the evaluationDefinitions
      const criterionkey = key.replace(/Criterion$/, '');

      // Define the reference to the Criterion's schema
      const criterionDefinition = `#/definitions/${criterionkey}`;

      // Attach schema for the current Criterion allowing Object or Array input
      schema.definitions[criterionkey] = Criteria[`${criterionkey}Schema`];
      schema.properties[criterionkey] = {
        oneOf: [
          { $ref: criterionDefinition },
          {
            type: 'array',
            items: {
              $ref: criterionDefinition
            }
          }
        ]
      };
    });

    // Compile the current schema
    CriteriaEvaluator.criteriaValidator = new Ajv().compile(schema);

    // Return the compiled validator
    return CriteriaEvaluator.criteriaValidator;
  }

  /**
   * Evaluates the given measurements data for the current evaluationDefinitions
   *
   * @param {Object} data Contains targets and nonTargets arrays of measurements
   */
  evaluate(data) {
    const nonconformities = [];

    // Iterates over all the defined criteria and run its evaluation method
    this.criteria.forEach(criterion => {
      // Evaluate conformity for the current criterion
      const criterionResult = criterion.evaluate(data);

      // Add the result to nonconformities if it has not passed in the evaluation
      if (!criterionResult.passed) {
        nonconformities.push(criterionResult);
      }
    });

    // Return all nonconformities found
    return nonconformities;
  }
}
