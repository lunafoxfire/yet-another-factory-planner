import React from 'react';
import { Button, Select, TextInput, Checkbox, Group, Title, Text, Divider } from '@mantine/core';
import { Trash2 } from 'react-feather';
import { items, resources } from '../../../../data';
import { useProductionContext } from '../../../../contexts/production';

const itemOptions = Object.keys(items)
  .filter((key) => items[key].producedFromRecipes.length !== 0 && items[key].usedInRecipes.length !== 0 && !resources[key])
  .map((key) => ({
    value: key,
    label: items[key].name,
  }))
  .sort((a, b) => {
    return a.label > b.label ? 1 : -1;
  });


const InputsTab = () => {
  const ctx = useProductionContext();

  function renderItemInputs() {
    return ctx.state.inputItems.map((data) => (
      <Group key={data.key}>
        <Select
          placeholder="Select an item"
          clearable
          searchable
          data={itemOptions}
          value={data.itemKey ? data.itemKey : ''}
          onChange={(value) => {
            ctx.dispatch({
              type: 'UPDATE_INPUT_ITEM',
              data: { ...data, itemKey: (value as string) },
            });
          }}
        />
        <TextInput
          className='no-spinner'
          type='number'
          min='0'
          step='1'
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
          style={{ fontWeight: 'normal' }}
          label='Unlimited'
          checked={data.unlimited}
          onChange={() => {
            ctx.dispatch({
              type: 'UPDATE_INPUT_ITEM',
              data: { ...data, unlimited: !data.unlimited },
            });
          }}
        />
        <Button
          color='danger'
          onClick={() => { ctx.dispatch({ type: 'DELETE_INPUT_ITEM', key: data.key }); }}
        >
          <Trash2 />
        </Button>
      </Group>
    ));
  }

  function renderWeightInputs() {
    const weightingOptions = ctx.state.weightingOptions;
    return (
      <>
        <Group>
          <label>
            Resource Efficiency
          </label>
          <TextInput
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
        </Group>
        <Group>
          <label>
            Power Efficiency
          </label>
          <TextInput
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
        <Group>
          <label>
            Complexity
          </label>
          <TextInput
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
        </Group>
      </>
    )
  }

  function renderResourceInputs() {
    return ctx.state.inputResources.map((data) => (
      <Group key={data.key}>
        <label>
          {items[data.itemKey].name}
        </label>
        <TextInput
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
        />
        <TextInput
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
          label='Weight'
        />
      </Group>
    ));
  }

  return (
    <>
      <Title order={3}>TextInput Items</Title>
      <Text>
        Select the items that you already have available and don't need to produce in this factory.
      </Text>
        {renderItemInputs()}
        <Button onClick={() => { ctx.dispatch({ type: 'ADD_INPUT_ITEM' }) }}>
          + Add TextInput
        </Button>
      <Divider />
      <Title order={3}>Weighting Options</Title>
      <Text>
        Adjust the weights affecting the importance of various properties of the factory. A value of 0 indicates that that property is not considered during factory layout.
      </Text>
      <Button onClick={() => { ctx.dispatch({ type: 'SET_ALL_WEIGHTS_DEFAULT' }) }}>
        Reset all weights
      </Button>
      {renderWeightInputs()}
      <Divider />
      <Title order={3}>Raw Resources</Title>
      <Text>
        Select the raw resources that are available to your factory. The default values are set to the map limits. The weight value is a number representing how valuable that resource is when comparing recipes. The defaults are calculated automatically according to node rarity.
      </Text>
      <Button onClick={() => { ctx.dispatch({ type: 'SET_RESOURCES_TO_MAP_LIMITS' }) }}>
        Set to Maximum
      </Button>
      <Button onClick={() => { ctx.dispatch({ type: 'SET_RESOURCES_TO_0' }) }}>
        Set to 0
      </Button>
      <Checkbox
        label='Allow hand-gathered resources'
        checked={ctx.state.allowHandGatheredItems}
        onChange={(e) => { ctx.dispatch({ type: 'SET_ALLOW_HAND_GATHERED_ITEMS', active: e.currentTarget.checked }) }}
        />
      {renderResourceInputs()}
    </>
  );
};

export default InputsTab;
