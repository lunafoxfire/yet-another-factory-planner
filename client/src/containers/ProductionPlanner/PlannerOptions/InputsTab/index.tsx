import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Button, Select, TextInput, Checkbox, Group, Title, Divider, Text } from '@mantine/core';
import { useProductionContext } from '../../../../contexts/production';
import TrashButton from '../../../../components/TrashButton';
import { Section, SectionDescription } from '../../../../components/Section';
import LabelWithTooltip from '../../../../components/LabelWithTooltip';



const InputsTab = () => {
  const ctx = useProductionContext();
  
  const itemOptions = useMemo(() => Object.keys(ctx.gameData.items)
    .filter((key) => ctx.gameData.items[key].producedFromRecipes.length !== 0 && ctx.gameData.items[key].usedInRecipes.length !== 0 && !ctx.gameData.resources[key])
    .map((key) => ({
      value: key,
      label: ctx.gameData.items[key].name,
    }))
    .sort((a, b) => {
      return a.label > b.label ? 1 : -1;
    }), [ctx.gameData])

  function renderItemInputs() {
    return ctx.state.inputItems.map((data) => {
      const selectedItem = itemOptions.find((io) => io.value === data.itemKey);
      return (
        <ItemContainer key={data.key}>
          <Row>
            <Select
              placeholder="Select an item"
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
                  type: 'UPDATE_INPUT_ITEM',
                  data: { ...data, itemKey: (value as string) },
                });
              }}
              style={{ flex: '1 1 auto' }}
            />
            <TrashButton onClick={() => { ctx.dispatch({ type: 'DELETE_INPUT_ITEM', key: data.key }); }} style={{ position: 'relative', top: '13px' }} />
          </Row>
          <Row>
            <TextInput
              label='Amount'
              className='no-spinner'
              type='number'
              min='0'
              step='1'
              disabled={data.unlimited}
              value={data.value}
              onChange={(e) => {
                ctx.dispatch({
                  type: 'UPDATE_INPUT_ITEM',
                  data: { ...data, value: e.currentTarget.value },
                });
              }}
            />
            <Checkbox
              className='label'
              label='Unlimited'
              checked={data.unlimited}
              onChange={() => {
                ctx.dispatch({
                  type: 'UPDATE_INPUT_ITEM',
                  data: { ...data, unlimited: !data.unlimited },
                });
              }}
              style={{ position: 'relative', top: '13px' }}
            />
          </Row>
          <Divider style={{ marginTop: '10px', marginBottom: '10px' }} />
        </ItemContainer>
      )
    });
  }

  function renderWeightInputs() {
    const weightingOptions = ctx.state.weightingOptions;
    return (
      <>
        <Group grow>
          <TextInput
            label={<LabelWithTooltip label='Resource Efficiency' tooltip='This weighting prioritizes using as few resources as possible.' />}
            className='no-spinner'
            type='number'
            min='0'
            step='1'
            value={weightingOptions.resources}
            onChange={(e) => {
              ctx.dispatch({
                type: 'UPDATE_WEIGHTING_OPTIONS',
                data: { ...weightingOptions, resources: e.currentTarget.value },
              });
            }}
          />
          <TextInput
            label={<LabelWithTooltip label='Power Efficiency' tooltip='This weighting prioritizes using as little power as possible.' />}
            className='no-spinner'
            type='number'
            min='0'
            step='1'
            value={weightingOptions.power}
            onChange={(e) => {
              ctx.dispatch({
                type: 'UPDATE_WEIGHTING_OPTIONS',
                data: { ...weightingOptions, power: e.currentTarget.value },
              });
            }}
          />
        </Group>
        <Group grow style={{ marginTop: '10px' }}>
          <TextInput
            label={<LabelWithTooltip label='Complexity' tooltip='This weighting prioritizes reducing the number of item types used in the factory. Very slow to optimize for larger factories (WIP).' />}
            className='no-spinner'
            type='number'
            min='0'
            step='1'
            value={weightingOptions.complexity}
            onChange={(e) => {
              ctx.dispatch({
                type: 'UPDATE_WEIGHTING_OPTIONS',
                data: { ...weightingOptions, complexity: e.currentTarget.value },
              });
            }}
          />
          <TextInput
            label={<LabelWithTooltip label='Buildings' tooltip='This weighting prioritizes using as few buildings as possible, discounting overclocking. May not be perfectly optimal, especially for smaller factories (WIP).' />}
            type='number'
            min='0'
            step='1'
            value={weightingOptions.buildings}
            onChange={(e) => {
              ctx.dispatch({
                type: 'UPDATE_WEIGHTING_OPTIONS',
                data: { ...weightingOptions, buildings: e.currentTarget.value },
              });
            }}
          />
        </Group>
      </>
    )
  }

  function renderResourceInputs() {
    return ctx.state.inputResources.map((data) => (
      <ItemContainer key={data.key}>
        <Row>
          <Text style={{ fontWeight: 'bold' }}>{ctx.gameData.items[data.itemKey].name}</Text>
        </Row>
        <Row>
          <TextInput
            label='Amount'
            className='no-spinner'
            type='number'
            min='0'
            step='1'
            value={data.value}
            onChange={(e) => {
              ctx.dispatch({
                type: 'UPDATE_INPUT_RESOURCE',
                data: { ...data, value: e.currentTarget.value },
              });
            }}
            disabled={data.unlimited}
            style={{ flex: '1 1 auto' }}
          />
          <Checkbox
            label='Unlimited'
            checked={data.unlimited}
            onChange={(e) => {
              ctx.dispatch({
                type: 'UPDATE_INPUT_RESOURCE',
                data: { ...data, unlimited: e.currentTarget.checked },
              });
            }}
            style={{ position: 'relative', top: '13px', flex: '1 1 auto' }}
          />
          <TextInput
            label='Weight'
            className='no-spinner'
            type='number'
            min='0'
            step='1'
            value={data.weight}
            onChange={(e) => {
              ctx.dispatch({
                type: 'UPDATE_INPUT_RESOURCE',
                data: { ...data, weight: e.currentTarget.value },
              });
            }}
            style={{ flex: '0 0 100px' }}
          />
        </Row>
        <Divider style={{ marginTop: '10px', marginBottom: '10px' }} />
      </ItemContainer>
    ));
  }

  return (
    <>
      <Section>
        <Title order={3}>Input Items</Title>
        <SectionDescription>
          Select the items that you already have available and don't need to produce in this factory.
        </SectionDescription>
        {renderItemInputs()}
        <Button onClick={() => { ctx.dispatch({ type: 'ADD_INPUT_ITEM' }) }}>
          + Add Input
        </Button>
      </Section>
      <Section>
        <Title order={3}>Weighting Options</Title>
        <SectionDescription>
          Adjust the weights affecting the importance of various properties of the factory. A value of 0 indicates that that property is not considered during factory layout.
        </SectionDescription>
        {renderWeightInputs()}
        <Button color='danger' onClick={() => { ctx.dispatch({ type: 'SET_ALL_WEIGHTS_DEFAULT', gameData: ctx.gameData }) }} style={{ marginTop: '15px' }}>
          Reset All Weights
        </Button>
      </Section>
      <Section>
        <Title order={3}>Raw Resources</Title>
        <SectionDescription>
          Select the raw resources that are available to your factory. The default values are set to the map limits. The weight value is a number representing how valuable that resource is when comparing recipes. The defaults are calculated automatically according to node rarity.
        </SectionDescription>
        <Group style={{ marginBottom: '15px' }}>
          <Button color='danger' onClick={() => { ctx.dispatch({ type: 'SET_RESOURCES_TO_MAP_LIMITS', gameData: ctx.gameData }) }}>
            Set All To Maximum
          </Button>
          <Button color='danger' onClick={() => { ctx.dispatch({ type: 'SET_RESOURCES_TO_0' }) }}>
            Set All To 0
          </Button>
        </Group>
        <Checkbox
          label='Allow hand-gathered resources (mycelia, flower petals, etc)'
          checked={ctx.state.allowHandGatheredItems}
          onChange={(e) => { ctx.dispatch({ type: 'SET_ALLOW_HAND_GATHERED_ITEMS', active: e.currentTarget.checked }) }}
          style={{ marginBottom: '25px' }}
          />
        {renderResourceInputs()}
      </Section>
    </>
  );
};

export default InputsTab;

const Row = styled(Group)`
  margin-bottom: 5px;
`;

const ItemContainer = styled.div`
  margin-bottom: 20px;
`;
