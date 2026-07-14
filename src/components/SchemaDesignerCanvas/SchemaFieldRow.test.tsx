import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SchemaFieldRow } from './SchemaFieldRow';
import { useSpecStore } from '../../state/useSpecStore';
import type { Schema, SchemaFieldRef } from '../../types/spec';

const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useSpecStore.setState(initialSpecState, true);
});

function setup() {
  const slug: Schema = {
    id: 'sc_slug',
    name: 'Slug',
    scalar: true,
    scalarType: 'string',
    scalarPrimitiveKey: 'slug',
    fields: [],
    contentTypes: [],
  };
  const refField: SchemaFieldRef = {
    id: 'f1',
    name: 'slug',
    kind: 'ref',
    ref: 'Slug',
    type: 'string',
    required: false,
    nullable: false,
    depth: 0,
    example: '',
  };
  const product: Schema = { id: 'sc_product', name: 'Product', fields: [refField], contentTypes: ['application/json'] };
  useSpecStore.setState({ schemas: [product, slug] });
  return { product, slug };
}

describe('SchemaFieldRow — primitive-backed ref fields', () => {
  it('shows the "Edit example" toggle for a $ref field backed by a primitive scalar schema', () => {
    const { product, slug } = setup();
    render(<SchemaFieldRow schema={product} fields={product.fields} index={0} schemas={[product, slug]} />);
    expect(screen.getByTitle('Edit example')).toBeInTheDocument();
  });

  it('expands to an editable EXAMPLE field placeholder-hinted with the primitive default, overridable and clearable', async () => {
    setup();
    const user = userEvent.setup();
    // A small reactive harness — mirrors how SchemaPropertiesEditor re-renders with fresh
    // store-backed props on every change, which a static-prop render wouldn't exercise.
    function Harness() {
      const schemas = useSpecStore((s) => s.schemas);
      const product = schemas.find((sc) => sc.name === 'Product')!;
      return <SchemaFieldRow schema={product} fields={product.fields} index={0} schemas={schemas} />;
    }
    render(<Harness />);

    await user.click(screen.getByTitle('Edit example'));
    const input = screen.getByPlaceholderText('my-awesome-product');
    expect(input).toHaveValue('');

    await user.type(input, 'custom-slug');
    expect(useSpecStore.getState().schemas[0].fields[0]).toMatchObject({ example: 'custom-slug' });

    await user.clear(input);
    expect(useSpecStore.getState().schemas[0].fields[0]).toMatchObject({ example: '' });
  });

  it('does not show the expand toggle for a plain $ref field pointing at an object schema', () => {
    const address: Schema = { id: 'sc_addr', name: 'Address', fields: [], contentTypes: [] };
    const refField: SchemaFieldRef = {
      id: 'f1',
      name: 'address',
      kind: 'ref',
      ref: 'Address',
      type: 'object',
      required: false,
      nullable: false,
      depth: 0,
      example: '',
    };
    const order: Schema = { id: 'sc_order', name: 'Order', fields: [refField], contentTypes: [] };
    useSpecStore.setState({ schemas: [order, address] });

    render(<SchemaFieldRow schema={order} fields={order.fields} index={0} schemas={[order, address]} />);
    expect(screen.queryByTitle('Edit example')).not.toBeInTheDocument();
    expect(screen.queryByTitle('More validation options')).not.toBeInTheDocument();
  });
});
