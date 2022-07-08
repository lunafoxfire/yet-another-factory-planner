import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Button, Select, TextInput, Group, Divider, Title } from '@mantine/core';
import { useProductionContext } from '../../../../contexts/production';
import { POINTS_ITEM_KEY } from '../../../../utilities/production-solver';
import { MAX_PRIORITY } from '../../../../contexts/production/consts';
import { Section, SectionDescription } from '../../../../components/Section';
import TrashButton from '../../../../components/TrashButton';


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

  const itemOptions = useMemo(() => {
    const opts = Object.keys(ctx.gameData.items)
      .filter((key) => ctx.gameData.items[key].producedFromRecipes.length !== 0 && !ctx.gameData.resources[key])
      .map((key) => ({
        value: key,
        label: ctx.gameData.items[key].name,
      }))
      .sort((a, b) => {
        return a.label > b.label ? 1 : -1;
      });

    opts.unshift({
      value: POINTS_ITEM_KEY,
      label: 'AWESOME Sink Points (x1000)'
    });

    return opts;
  }, [ctx.gameData]);
    
  function renderItemInputs() {
    return ctx.state.productionItems.map((data) => {
      const modeOptions = [...baseModeOptions];
      if (data.itemKey) {
        const itemInfo = ctx.gameData.items[data.itemKey];
        const recipeList = itemInfo?.producedFromRecipes || [];
        recipeList.forEach((recipeKey) => {
          const recipeInfo = ctx.gameData.recipes[recipeKey];
          const target = recipeInfo?.products.find((p) => p.itemClass === data.itemKey);
          if (target) {
            const name = itemInfo.name === recipeInfo.name ? 'Base Recipe' : recipeInfo.name.replace('Alternate: ', '');
            modeOptions.push({ value: recipeKey, label: `${name} [${target.perMinute}/min]` });
          }
        });
      }
      const selectedItem = itemOptions.find((io) => io.value === data.itemKey);
      return (
        <ItemContainer key={data.key}>
          <Row>
            <Select
              placeholder='Select an item'
              label='Item'
              clearable
              searchable
              filter={(value, item) => {
                if (selectedItem && value === selectedItem.label) {
                  return true;
                }
                return !!item.label?.toLowerCase().includes(value.toLowerCase());
              }}
              data={itemOptions}
              value={data.itemKey ? data.itemKey : ''}
              onChange={(value) => {
                ctx.dispatch({
                  type: 'SET_PRODUCTION_ITEM',
                  data: { key: data.key, itemKey: (value as any) },
                });
              }}
              style={{ flex: '1 1 auto' }}
            />
            <TrashButton onClick={() => { ctx.dispatch({ type: 'DELETE_PRODUCTION_ITEM', key: data.key }); }} style={{ position: 'relative', top: '13px' }} />
          </Row>
          <Row>
            {
              data.mode === 'maximize'
                ? (
                  <Select
                    label='Priority'
                    data={priorityOptions}
                    value={data.value}
                    onChange={(value) => {
                      ctx.dispatch({
                        type: 'SET_PRODUCTION_ITEM_AMOUNT',
                        data: { key: data.key, amount: (value as any) },
                      });
                    }}
                    style={{ width: '160px' }}
                  />
                )
                : (
                  <TextInput
                    label='Amount'
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
                    style={{ width: '160px' }}
                  />
                )
            }
            <Select
              label='Mode'
              data={modeOptions}
              value={data.mode}
              onChange={(value) => {
                ctx.dispatch({
                  type: 'SET_PRODUCTION_ITEM_MODE',
                  data: { key: data.key, mode: (value as any) },
                });
              }}
              style={{ width: '280px' }}
            />
          </Row>
          <Divider style={{ marginTop: '10px', marginBottom: '10px' }} />
        </ItemContainer>
      );
    });
  }

  return (
    <>
      <Section>
        <Title order={3}>Production Goals</Title>
        <SectionDescription>
          Select the items you want to produce. When maximizing multiple outputs, higher priority items will be maximized first. When selecting a recipe as a target, the factory will be forced to use that recipe for the final output.
        </SectionDescription>
        {renderItemInputs()}
        <Button onClick={() => { ctx.dispatch({ type: 'ADD_PRODUCTION_ITEM' }) }}>
          + Add Product
        </Button>
      </Section>
    </>
  );
};

export default ProductionTab;

const Row = styled(Group)`
  margin-bottom: 5px;
`;

const ItemContainer = styled.div`
  margin-bottom: 20px;
`;
