import React from 'react';
import { Button, Dropdown, Input, Grid, Icon } from 'semantic-ui-react';
import { items, recipes, resources } from '../../../../data';
import { MAX_PRIORITY, useProductionContext } from '../../../../contexts/production';
import { POINTS_ITEM_KEY } from '../../../../utilities/production-solver';

const itemOptions = Object.keys(items)
  .filter((key) => items[key].producedFromRecipes.length !== 0 && !resources[key])
  .map((key) => ({
    value: key,
    text: items[key].name,
  }))
  .sort((a, b) => {
    return a.text > b.text ? 1 : -1;
  });

itemOptions.unshift({
  value: POINTS_ITEM_KEY,
  text: 'AWESOME Sink Points (x1000)'
})

const baseModeOptions = [
  { value: 'per-minute', text: 'Items Per Min' },
  { value: 'maximize', text: 'Maximize Output' },
];

const priorityOptions = Array(MAX_PRIORITY)
  .fill('')
  .map((_, i) => ({ value: `${i + 1}`, text: `Priority: ${i + 1}` }))
  .reverse();

const ProductionTab = () => {
  const ctx = useProductionContext();

  function renderItemInputs() {
    return ctx.state.productionItems.map((data) => {
      const modeOptions = [...baseModeOptions];
      if (data.itemKey) {
        const recipeList = items[data.itemKey]?.producedFromRecipes || [];
        recipeList.forEach((recipeKey) => {
          const recipeInfo = recipes[recipeKey];
          const target = recipeInfo?.products.find((p) => p.itemClass === data.itemKey);
          if (target) {
            const name = recipeInfo.isAlternate ? recipeInfo.name.replace('Alternate: ', '') : 'Base Recipe';
            modeOptions.push({ value: recipeKey, text: `${name} [${target.perMinute}/min]` });
          }
        });
      }
      return (
        <Grid.Row key={data.key}>
          <Grid.Column style={{ flex: '1 1 auto', minWidth: '210px' }}>
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
                  type: 'SET_PRODUCTION_ITEM',
                  data: { key: data.key, itemKey: (value as any) },
                });
              }}
            />
          </Grid.Column>
          <Grid.Column style={{ flex: '1 1 auto', minWidth: '280px', display: 'flex' }}>
            {
              data.mode === 'maximize'
                ? (
                  <Dropdown
                    style={{ flex: '0 0 130px', minWidth: '0px' }}
                    selection
                    options={priorityOptions}
                    value={data.value}
                    onChange={(e, { value }) => {
                      ctx.dispatch({
                        type: 'SET_PRODUCTION_ITEM_AMOUNT',
                        data: { key: data.key, amount: (value as any) },
                      });
                    }}
                  />
                )
                : (
                  <Input
                    style={{ flex: '0 0 130px' }}
                    className='no-spinner'
                    type='number'
                    min='0'
                    step='1'
                    fluid
                    value={data.value}
                    onChange={(e, { value }) => {
                      ctx.dispatch({
                        type: 'SET_PRODUCTION_ITEM_AMOUNT',
                        data: { key: data.key, amount: value },
                      });
                    }}
                    action
                  />
                )
            }
            <Dropdown
              style={{ flex: '1 1 auto', minWidth: '0px' }}
              selection
              options={modeOptions}
              value={data.mode}
              onChange={(e, { value }) => {
                ctx.dispatch({
                  type: 'SET_PRODUCTION_ITEM_MODE',
                  data: { key: data.key, mode: (value as any) },
                });
              }}
            />
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
        Select the items you want to produce. When maximizing multiple outputs, higher priority items will be maximized first. When selecting a recipe, the factory will be forced to use that recipe for the final output.
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
