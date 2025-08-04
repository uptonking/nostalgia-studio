import type { FileInfo, API } from 'jscodeshift';
import type { TestOptions } from 'jscodeshift/src/testUtils';

// Extend the types to include the declare property
interface ClassPropertyWithDeclare {
  declare?: boolean;
  [key: string]: any;
}

interface TSPropertySignatureWithDeclare {
  declare?: boolean;
  [key: string]: any;
}

interface TransformOptions {
  filesSrc?: Array<{
    path: string;
    className: string;
    fieldName: string;
  }>;
}

export default function transformer(fileInfo: FileInfo, api: API, options: TransformOptions = {}) {
  const j = api.jscodeshift;
  const { filesSrc = [] } = options;

  // Parse with TypeScript parser
  const root = j(fileInfo.source);

  // Find ALL configurations for the current file (not just the first one)
  const currentFileConfigs = filesSrc.filter(config => 
    fileInfo.path.endsWith(config.path) || fileInfo.path === config.path
  );

  if (currentFileConfigs.length === 0) {
    // No configuration for this file, return unchanged
    return fileInfo.source;
  }

  // Process each configuration for this file
  currentFileConfigs.forEach(({ className, fieldName }) => {
    // Find the specific class and field to add declare to
    root
      .find(j.ClassDeclaration)
      .filter((path) => {
        return path.value.id && path.value.id.name === className;
      })
      .forEach((classPath) => {
        // Find class properties within this class
        j(classPath)
          .find(j.ClassProperty)
          .filter((propertyPath) => {
            const key = propertyPath.value.key;
            return key && 
                   ((key.type === 'Identifier' && key.name === fieldName) ||
                    (key.type === 'StringLiteral' && key.value === fieldName));
          })
          .forEach((propertyPath) => {
            // Add declare modifier
            const node = propertyPath.value as ClassPropertyWithDeclare;
            node.declare = true;
          });

        // Also handle TSPropertySignature in case there are any
        j(classPath)
          .find(j.TSPropertySignature)
          .filter((propertyPath) => {
            const key = propertyPath.value.key;
            return key && 
                   ((key.type === 'Identifier' && key.name === fieldName) ||
                    (key.type === 'StringLiteral' && key.value === fieldName));
          })
          .forEach((propertyPath) => {
            const node = propertyPath.value as TSPropertySignatureWithDeclare;
            node.declare = true;
          });
      });
  });

  return root.toSource({
    quote: 'single',
    trailingComma: true,
  });
}

// Use TypeScript parser for transformations
export const parser: TestOptions['parser'] = 'ts';
