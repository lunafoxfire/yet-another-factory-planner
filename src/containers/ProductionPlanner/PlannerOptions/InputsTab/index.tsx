import React from 'react';
import { Button, Dropdown, Input, Checkbox, Grid, Icon, Header, Divider } from 'semantic-ui-react';
import { items, itemRecipeMap } from '../../../../data';
import { useProductionContext } from '../../../../contexts/production';

const itemOptions = Object.keys(itemRecipeMap)
  .map((key) => ({
    value: key,
    text: items[key].name,
  }))
  .sort((a, b) => {
    return a.text > b.text ? 1 : -1;
  });


const InputsTab = () => {
  const ctx = useProductionContext();

  function renderItemInputs() {
    return ctx.state.inputItems.map((data) => (
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
                type: 'UPDATE_INPUT_ITEM',
                data: { ...data, itemKey: String(value) },
              });
            }}
          />
        </Grid.Column>
        <Grid.Column style={{ flex: '0 0 250px' }}>
          <Input
            className='no-spinner'
            type='number'
            min='0'
            step='1'
            fluid
            value={data.value}
            onChange={(e, { value }) => {
              ctx.dispatch({
                type: 'UPDATE_INPUT_ITEM',
                data: { ...data, value: value },
              });
            }}
            labelPosition='right'
          >
            <input disabled={data.unlimited} />
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
          </Input>
        </Grid.Column>
        <Grid.Column style={{ flex: '0 0 70px' }}>
          <Button
            icon
            negative
            onClick={() => { ctx.dispatch({ type: 'DELETE_INPUT_ITEM', key: data.key }); }}
          >
            <Icon name='trash alternate outline' />
          </Button>
        </Grid.Column>
      </Grid.Row>
    ));
  }

  function renderResourceInputs() {
    return ctx.state.inputResources.map((data) => (
      <Grid.Row key={data.key}>
        <Grid.Column style={{ flex: '0 0 200px', display: 'flex', alignItems: 'center' }}>
          {items[data.itemKey].name}
        </Grid.Column>
        <Grid.Column style={{ flex: '1 1 auto' }}>
          <Input
            className='no-spinner'
            type='number'
            min='0'
            step='1'
            fluid
            value={data.value}
            onChange={(e, { value }) => {
              ctx.dispatch({
                type: 'UPDATE_INPUT_RESOURCE',
                data: { ...data, value: value },
              });
            }}
            labelPosition='right'
          >
            <input disabled={data.unlimited} />
            <Checkbox
              className='label'
              style={{ fontWeight: 'normal' }}
              label='Unlimited'
              checked={data.unlimited}
              onChange={() => {
                ctx.dispatch({
                  type: 'UPDATE_INPUT_RESOURCE',
                  data: { ...data, unlimited: !data.unlimited },
                });
              }}
            />
          </Input>
        </Grid.Column>
      </Grid.Row>
    ));
  }

  return (
    <>
      <Header>Input Items</Header>
      <p>
        Select the items that you already have available and don't need to produce in this factory.
      </p>
      <Grid>
        {renderItemInputs()}
        <Grid.Row>
          <Grid.Column>
            <Button
              primary
              onClick={() => { ctx.dispatch({ type: 'ADD_INPUT_ITEM' }) }}
            >
              Add Input
            </Button>
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <Divider />
      <Header>Raw Resources</Header>
      <p>
        Select the raw resources that are available to your factory. The default values are set to the map limits.
      </p>
      <Grid>
        <Grid.Row columns={1}>
          <Grid.Column>
            <Button
              primary
              onClick={() => { ctx.dispatch({ type: 'SET_RESOURCES_TO_MAP_LIMITS' }) }}
            >
              Set to Maximum
            </Button>
            <Button
              primary
              onClick={() => { ctx.dispatch({ type: 'SET_RESOURCES_TO_0' }) }}
            >
              Set to 0
            </Button>
          </Grid.Column>
        </Grid.Row>
        {renderResourceInputs()}
      </Grid>
    </>
  );
};

export default InputsTab;
