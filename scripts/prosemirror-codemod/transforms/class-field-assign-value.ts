import type { FileInfo, API } from 'jscodeshift';
import type { TestOptions } from 'jscodeshift/src/testUtils';

interface TransformOptions {
  filesSrc?: Array<{
    path: string;
    className: string;
    fieldName: string;
    fieldValue: any;
    literalFieldValue?: boolean;
    addFieldIfNotExist?: boolean;
  }>;
}

export default function transformer(
  fileInfo: FileInfo,
  api: API,
  options: TransformOptions = {},
) {
  const j = api.jscodeshift;
  const { filesSrc = [] } = options;

  // Helper function to create value node based on type and literalFieldValue flag
  function createValueNode(fieldValue: any, literalFieldValue: boolean) {
    if (literalFieldValue) {
      // Parse as literal expression (e.g., "MapMode.TrackDel" -> MemberExpression)
      const valueStr = String(fieldValue);

      // Handle member expressions like "MapMode.TrackDel"
      if (valueStr.includes('.')) {
        const parts = valueStr.split('.');
        let expression = j.identifier(parts[0]);

        for (let i = 1; i < parts.length; i++) {
          expression = j.memberExpression(expression, j.identifier(parts[i]));
        }

        return expression;
      } else {
        // Simple identifier
        return j.identifier(valueStr);
      }
    } else {
      // Create typed literals as before
      if (typeof fieldValue === 'number') {
        return j.numericLiteral(fieldValue);
      } else if (typeof fieldValue === 'string') {
        return j.stringLiteral(fieldValue);
      } else if (typeof fieldValue === 'boolean') {
        return j.booleanLiteral(fieldValue);
      } else if (fieldValue === null) {
        return j.nullLiteral();
      } else {
        return j.identifier(String(fieldValue));
      }
    }
  }

  // Parse with TypeScript parser
  const root = j(fileInfo.source);

  // Find ALL configurations for the current file (not just the first one)
  const currentFileConfigs = filesSrc.filter(
    (config) =>
      fileInfo.path.endsWith(config.path) || fileInfo.path === config.path,
  );

  if (currentFileConfigs.length === 0) {
    // No configuration for this file, return unchanged
    return fileInfo.source;
  }

  // Process each configuration for this file
  currentFileConfigs.forEach(
    ({
      className,
      fieldName,
      fieldValue,
      literalFieldValue = false,
      addFieldIfNotExist = false,
    }) => {
      // Find the specific class to work with
      root
        .find(j.ClassDeclaration)
        .filter((path) => {
          return path.value.id && path.value.id.name === className;
        })
        .forEach((classPath) => {
          let fieldFound = false;

          // First, try to find and update existing ClassProperty
          j(classPath)
            .find(j.ClassProperty)
            .filter((propertyPath) => {
              const key = propertyPath.value.key;
              return (
                key &&
                ((key.type === 'Identifier' && key.name === fieldName) ||
                  (key.type === 'StringLiteral' && key.value === fieldName))
              );
            })
            .forEach((propertyPath) => {
              fieldFound = true;
              const node = propertyPath.value;

              // Only assign value if there's no existing value
              if (!node.value) {
                const valueNode = createValueNode(
                  fieldValue,
                  literalFieldValue,
                );
                node.value = valueNode;
              }
            });

          // Then, try to find and update existing TSPropertySignature
          j(classPath)
            .find(j.TSPropertySignature)
            .filter((propertyPath) => {
              const key = propertyPath.value.key;
              return (
                key &&
                ((key.type === 'Identifier' && key.name === fieldName) ||
                  (key.type === 'StringLiteral' && key.value === fieldName))
              );
            })
            .forEach((propertyPath) => {
              fieldFound = true;
              // TSPropertySignature doesn't support default values in the same way
              // We need to convert it to a ClassProperty with a value
              const node = propertyPath.value;
              const key = node.key;
              const typeAnnotation = node.typeAnnotation;

              const valueNode = createValueNode(fieldValue, literalFieldValue);

              // Replace TSPropertySignature with ClassProperty that has a default value
              const classProperty = j.classProperty(key, valueNode);
              classProperty.typeAnnotation = typeAnnotation;

              j(propertyPath).replaceWith(classProperty);
            });

          // If field not found and addFieldIfNotExist is true, add new field
          if (!fieldFound && addFieldIfNotExist) {
            const valueNode = createValueNode(fieldValue, literalFieldValue);
            const newProperty = j.classProperty(
              j.identifier(fieldName),
              valueNode,
            );

            // Add the new property to the class body
            const classBody = classPath.value.body;
            classBody.body.push(newProperty);
          }
        });
    },
  );

  return root.toSource({
    quote: 'single',
    trailingComma: true,
  });
}

// Use TypeScript parser for transformations
export const parser: TestOptions['parser'] = 'ts';
