/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type AttachmentField,
  type AutoIncrementField,
  type BoolField,
  type ColorField,
  type CountField,
  type CreatedAtField,
  type CreatedByField,
  type DateField,
  type DateRangeField,
  type EmailField,
  type IFieldVisitor,
  type IdField,
  type LookupField,
  type NumberField,
  type ParentField,
  type RatingField,
  type ReferenceField,
  type SelectField,
  type StringField,
  type SumField,
  type TreeField,
  type UpdatedAtField,
  type UpdatedByField,
} from '../field';
import { type AverageField } from '../field/average-field';
import { type CollaboratorField } from '../field/collaborator-field';

export abstract class AbstractReferenceFieldVisitor implements IFieldVisitor {
  id(field: IdField): void {}
  createdAt(field: CreatedAtField): void {}
  createdBy(field: CreatedByField): void {}
  updatedBy(field: UpdatedByField): void {}
  updatedAt(field: UpdatedAtField): void {}
  attachment(field: AttachmentField): void {}
  autoIncrement(field: AutoIncrementField): void {}
  string(field: StringField): void {}
  email(field: EmailField): void {}
  color(field: ColorField): void {}
  number(field: NumberField): void {}
  bool(field: BoolField): void {}
  date(field: DateField): void {}
  dateRange(field: DateRangeField): void {}
  select(field: SelectField): void {}
  abstract reference(field: ReferenceField): void;
  abstract tree(field: TreeField): void;
  abstract parent(field: ParentField): void;
  rating(field: RatingField): void {}
  count(field: CountField): void {}
  sum(field: SumField): void {}
  average(field: AverageField): void {}
  lookup(field: LookupField): void {}
  collaborator(field: CollaboratorField): void {}
}
