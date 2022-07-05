import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Container, Tabs, Paper, Title, Divider, Group, Button, Switch, Space, TextInput, Popover, Text } from '@mantine/core';
import { TrendingUp, Shuffle, Box } from 'react-feather';
import { useProductionContext } from '../../../contexts/production';
import ProductionTab from './ProductionTab';
import InputsTab from './InputsTab';
import RecipesTab from './RecipesTab';
import { usePrevious } from '../../../hooks/usePrevious';

const PlannerOptions = () => {
  const ctx = useProductionContext();
  const [popoverOpened, setPopoverOpened] = useState(false);

  const prevShareLink = usePrevious(ctx.shareLink);
  useEffect(() => {
    if (ctx.shareLink && ctx.shareLink !== prevShareLink) {
      navigator.clipboard.writeText(ctx.shareLink);
      setPopoverOpened(true);
    }
  }, [ctx.shareLink, prevShareLink]);

  const handleLinkInputClicked = () => {
    if (ctx.shareLink) {
      navigator.clipboard.writeText(ctx.shareLink);
      setPopoverOpened(true);
    }
  }
  
  return (
    <>
      <Paper style={{ marginBottom: '20px', paddingTop: '10px' }}>
        <Title order={2}>Control Panel</Title>
        <Divider style={{ marginTop: '5px', marginBottom: '15px' }} />
        <Group style={{ marginBottom: '15px' }}>
          <Button
            onClick={() => { ctx.calculate(); }}
            disabled={ctx.autoCalculate}
            style={{ marginRight: '15px', width: '125px' }}
          >
            Calculate
          </Button>
          <Switch
            size='md'
            label='Auto-calculate (disable if things get laggy)'
            checked={ctx.autoCalculate}
            onChange={(e) => { ctx.setAutoCalculate(e.currentTarget.checked); }}
          />
        </Group>
        <Group style={{ marginBottom: '15px' }}>
          <Button
            color='positive'
            onClick={() => { ctx.generateShareLink(); }}
            loading={ctx.shareLinkLoading}
            style={{ width: '125px' }}
          >
            Save & Share
          </Button>
          <Popover
            opened={popoverOpened}
            onClose={() => setPopoverOpened(false)}
            position='right'
            withArrow
            styles={{
              root: {
                flex: '1 1 auto !important',
              },
              inner: {
                padding: '10px 16px',
              },
            }}
            target={
              <TextInput
                value={ctx.shareLink}
                placeholder='Save factory to generate a link'
                readOnly={true}
                onClick={() => { handleLinkInputClicked(); }}
                styles={{
                  root: {
                    flex: '1 1 auto !important',
                  },
                }}
              />
            }
          >
            <Text>Link copied!</Text>
          </Popover>
        </Group>
        <Space />
        <Group style={{ marginBottom: '15px' }} position='right'>
          <Button
            color='danger'
            onClick={() => { ctx.dispatch({ type: 'RESET_FACTORY' }) }}
          >
            Reset ALL Factory Options
          </Button>
        </Group>
      </Paper>
      <Tabs grow variant='outline'>
        <Tabs.Tab label='Production' icon={<TrendingUp size={18} />}>
          <TabContainer fluid>
            <ProductionTab />
          </TabContainer>
        </Tabs.Tab>
        <Tabs.Tab label='Inputs' icon={<Shuffle size={18} />}>
          <TabContainer fluid>
            <InputsTab />
          </TabContainer>
        </Tabs.Tab>
        <Tabs.Tab label='Recipes' icon={<Box size={18} />}>
          <TabContainer fluid>
            <RecipesTab />
          </TabContainer>
        </Tabs.Tab>
      </Tabs>
    </>
  );
};

export default PlannerOptions;

const TabContainer = styled(Container)`
  padding: 15px 15px;
  background: ${({ theme }) => theme.colors.background[1]}
`;
