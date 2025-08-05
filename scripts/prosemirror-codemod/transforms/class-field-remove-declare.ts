import type { Transform, FileInfo, API } from 'jscodeshift';
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

export default function transformer(fileInfo: FileInfo, api: API) {
  const j = api.jscodeshift;

  // Parse with TypeScript parser
  const root = j(fileInfo.source);

  // Find all class property definitions that have the declare modifier
  root
    .find(j.ClassProperty)
    .filter((path) => {
      // Check if the property has a declare modifier
      const node = path.value as ClassPropertyWithDeclare;
      return node.declare === true;
    })
    .forEach((path) => {
      // Remove the declare modifier
      const node = path.value as ClassPropertyWithDeclare;
      node.declare = false;
    });

  // Also handle TSPropertySignature in case there are any
  root
    .find(j.TSPropertySignature)
    .filter((path) => {
      const node = path.value as TSPropertySignatureWithDeclare;
      return node.declare === true;
    })
    .forEach((path) => {
      const node = path.value as TSPropertySignatureWithDeclare;
      node.declare = false;
    });

  return root.toSource({
    quote: 'single',
    trailingComma: true,
  });
}

// Use TypeScript parser for transformations
export const parser: TestOptions['parser'] = 'ts';
