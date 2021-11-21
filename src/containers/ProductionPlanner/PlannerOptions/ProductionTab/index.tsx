import React from 'react';
import { Button, Dropdown, Input, Grid, Icon } from 'semantic-ui-react';
import { items, itemRecipeMap, recipes } from '../../../../data';
import { useProductionContext } from '../../../../contexts/production';

const itemOptions = Object.keys(itemRecipeMap)
  .map((key) => ({
    value: key,
    text: items[key].name,
  }))
  .sort((a, b) => {
    return a.text > b.text ? 1 : -1;
  });

const baseModeOptions = [
  { value: 'per-minute', text: 'Items Per Min' },
  { value: 'maximize', text: 'Maximize Output' },
];

const ProductionTab = () => {
  const ctx = useProductionContext();

  function renderItemInputs() {
    return ctx.state.productionItems.map((data) => {
      const modeOptions = [...baseModeOptions];
      if (data.itemKey) {
        const recipeList = itemRecipeMap[data.itemKey];
        recipeList.forEach((recipeKey) => {
          const recipeInfo = recipes[recipeKey];
          const target = recipeInfo?.products.find((p) => p.itemClass === data.itemKey);
          if (target) {
            const name = recipeInfo.isAlternate ? recipeInfo.name.replace('Alternate: ', '') : 'Base Recipe';
            modeOptions.push({ value: recipeKey, text: `${name} [${target.perMinute} / min]` });
          }
        });
      }
      return (
        <Grid.Row key={data.key}>
          <Grid.Column style={{ flex: '1 1 auto' }}>
            <Dropdown
              fluid
              placeholder="Select an item"
              selection
              search
              clearable
              options={itemOptions}
              value={data.itemKey ? data.itemKey : ''}
              onChange={(e, { value }) => {
                ctx.dispatch({
                  type: 'UPDATE_PRODUCTION_ITEM',
                  data: { ...data, itemKey: (value as string), mode: 'per-minute' },
                });
              }}
            />
          </Grid.Column>
          <Grid.Column style={{ flex: '0 0 350px' }}>
            <Input
              className='no-spinner'
              type='number'
              min='0'
              step='1'
              fluid
              value={data.value}
              onChange={(e, { value }) => {
                ctx.dispatch({
                  type: 'UPDATE_PRODUCTION_ITEM',
                  data: { ...data, value: value },
                });
              }}
              action
            >
              <input disabled={data.mode === 'maximize'} />
              <Dropdown
                style={{ width: '250px', minWidth: '0px' }}
                selection
                options={modeOptions}
                value={data.mode}
                onChange={(e, { value }) => {
                  ctx.dispatch({
                    type: 'UPDATE_PRODUCTION_ITEM',
                    data: { ...data, mode: (value as any) },
                  });
                }}
              />
            </Input>
          </Grid.Column>
          <Grid.Column style={{ flex: '0 0 70px' }}>
            <Button
              icon
              negative
              onClick={() => { ctx.dispatch({ type: 'DELETE_PRODUCTION_ITEM', key: data.key }); }}
            >
              <Icon name='trash alternate outline' />
            </Button>
          </Grid.Column>
        </Grid.Row>
      );
    });
  }

  return (
    <>
      <p>
        Select the items you want to produce.
      </p>
      <Grid>
        {renderItemInputs()}
        <Grid.Row columns={1}>
          <Grid.Column>
            <Button
              primary
              onClick={() => { ctx.dispatch({ type: 'ADD_PRODUCTION_ITEM' })}}
            >
              + Add Product
            </Button>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </>
  );
};

export default ProductionTab;
