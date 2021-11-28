import React from 'react';
import { Button, Select, TextInput, Group, Text } from '@mantine/core';
import { Trash2 } from 'react-feather';
import { items, recipes, resources } from '../../../../data';
import { useProductionContext } from '../../../../contexts/production';
import { MAX_PRIORITY } from '../../../../contexts/production/reducer';
import { POINTS_ITEM_KEY } from '../../../../utilities/production-solver';

const itemOptions = Object.keys(items)
  .filter((key) => items[key].producedFromRecipes.length !== 0 && !resources[key])
  .map((key) => ({
    value: key,
    label: items[key].name,
  }))
  .sort((a, b) => {
    return a.label > b.label ? 1 : -1;
  });

itemOptions.unshift({
  value: POINTS_ITEM_KEY,
  label: 'AWESOME Sink Points (x1000)'
});

const baseModeOptions = [
  { value: 'per-minute', label: 'Items Per Min' },
  { value: 'maximize', label: 'Maximize Output' },
];

const priorityOptions = Array(MAX_PRIORITY)
  .fill('')
  .map((_, i) => ({ value: `${i + 1}`, label: `Priority: ${i + 1}` }))
  .reverse();

const ProductionTab = () => {
  const ctx = useProductionContext();

  function renderItemInputs() {
    return ctx.state.productionItems.map((data) => {
      const modeOptions = [...baseModeOptions];
      if (data.itemKey) {
        const itemInfo = items[data.itemKey];
        const recipeList = itemInfo?.producedFromRecipes || [];
        recipeList.forEach((recipeKey) => {
          const recipeInfo = recipes[recipeKey];
          const target = recipeInfo?.products.find((p) => p.itemClass === data.itemKey);
          if (target) {
            const name = itemInfo.name === recipeInfo.name ? recipeInfo.name.replace('Alternate: ', '') : 'Base Recipe';
            modeOptions.push({ value: recipeKey, label: `${name} [${target.perMinute}/min]` });
          }
        });
      }
      return (
        <React.Fragment key={data.key}>
          <Group>
            <Select
              placeholder="Select an item"
              clearable
              searchable
              data={itemOptions}
              value={data.itemKey ? data.itemKey : ''}
              onChange={(value) => {
                ctx.dispatch({
                  type: 'SET_PRODUCTION_ITEM',
                  data: { key: data.key, itemKey: (value as any) },
                });
              }}
            />
            <Button
              color='danger'
              onClick={() => { ctx.dispatch({ type: 'DELETE_PRODUCTION_ITEM', key: data.key }); }}
            >
              <Trash2 />
            </Button>
          </Group>
          <Group>
            {
              data.mode === 'maximize'
                ? (
                  <Select
                    data={priorityOptions}
                    value={data.value}
                    onChange={(value) => {
                      ctx.dispatch({
                        type: 'SET_PRODUCTION_ITEM_AMOUNT',
                        data: { key: data.key, amount: (value as any) },
                      });
                    }}
                  />
                )
                : (
                  <TextInput
                    className='no-spinner'
                    type='number'
                    min='0'
                    step='1'
                    value={data.value}
                    onChange={(e) => {
                      ctx.dispatch({
                        type: 'SET_PRODUCTION_ITEM_AMOUNT',
                        data: { key: data.key, amount: e.currentTarget.value },
                      });
                    }}
                  />
                )
            }
            <Select
              data={modeOptions}
              value={data.mode}
              onChange={(value) => {
                ctx.dispatch({
                  type: 'SET_PRODUCTION_ITEM_MODE',
                  data: { key: data.key, mode: (value as any) },
                });
              }}
            />
          </Group>
        </React.Fragment>
      );
    });
  }

  return (
    <>
      <Text>
        Select the items you want to produce. When maximizing multiple outputs, higher priority items will be maximized first. When selecting a recipe, the factory will be forced to use that recipe for the final output.
      </Text>
      {renderItemInputs()}
      <Button onClick={() => { ctx.dispatch({ type: 'ADD_PRODUCTION_ITEM' }) }}>
        + Add Product
      </Button>
    </>
  );
};

export default ProductionTab;
