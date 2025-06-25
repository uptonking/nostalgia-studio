import { ChangeSet, Compartment, Text } from '@codemirror/state';

function changesetLengthTest() {
  const content = 'hello\nworld';
  const currentDoc = 'hello';
  const DefaultSplit = /\r\n?|\n/;
  const changes = ChangeSet.fromJSON([
    [currentDoc.length, ...(content?.split(DefaultSplit) || [])],
  ]);
  const updates = [
    {
      agentUserId: 'this.currentAgentUserId',
      changes: changes.toJSON(),
    },
  ];
  const uuid = 'uuidThisId';
  const doc = Text.of(currentDoc.split(DefaultSplit) || []);

  console.log(
    'changeset length',
    changes.length,
    doc.length,
    content.length,
    changes,
  );
}

changesetLengthTest();
