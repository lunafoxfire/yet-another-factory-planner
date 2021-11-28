import React, { useState, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { List, Checkbox, TextInput, Button, Group, Title, Grid, Col } from '@mantine/core';
import { Search } from 'react-feather';
import { recipes } from '../../../../data';
import { useProductionContext } from '../../../../contexts/production';
import { Section, SectionDescription } from '../../../../components/Section';

const cleanAltNameRegex = /^Alternate: /;
const baseRecipes: { key: string, label: string }[] = [];
const altRecipes: { key: string, label: string }[] = [];
Object.entries(recipes)
  .forEach(([key, data]) => {
    if (data.isAlternate) {
      altRecipes.push({
        key,
        label: data.name.replace(cleanAltNameRegex, ''),
      });
    } else {
      baseRecipes.push({
        key,
        label: data.name,
      });
    }
  });
baseRecipes.sort((a, b) => (a.label > b.label ? 1 : -1));
altRecipes.sort((a, b) => (a.label > b.label ? 1 : -1));

const RecipesTab = () => {
  const ctx = useProductionContext();
  const [searchValue, setSearchValue] = useState('');

  const renderRecipeList = useCallback((recipeList: { key: string, label: string }[]) => {
    return recipeList.map(({ key, label }) => ({
      label,
      component: (
        <List.Item key={key}>
          <Checkbox
            label={label}
            checked={ctx.state.allowedRecipes[key]}
            onChange={() => {
              ctx.dispatch({
                type: 'SET_RECIPE_ACTIVE',
                key,
                active: !ctx.state.allowedRecipes[key],
              });
            }}
          />
        </List.Item>
      )
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.state, ctx.dispatch]);

  const renderedBaseRecipes = useMemo(() => renderRecipeList(baseRecipes), [renderRecipeList]);
  const renderedAltRecipes = useMemo(() => renderRecipeList(altRecipes), [renderRecipeList]);

  function renderRecipeOptions(alternates: boolean) {
    const rendered = alternates ? renderedAltRecipes : renderedBaseRecipes
    return (
      <>
        <Group style={{ marginTop: '5px', marginBottom: '10px' }}>
          <Button onClick={() => { ctx.dispatch({ type: 'MASS_SET_RECIPES_ACTIVE', alternates, active: true }) }}>
            Select All
          </Button>
          <Button onClick={() => { ctx.dispatch({ type: 'MASS_SET_RECIPES_ACTIVE', alternates, active: false }) }}>
            Select None
          </Button>
        </Group>
        <List listStyleType='none' spacing={6}>
          {rendered.filter(({ label }) => label.toLowerCase().includes(searchValue)).map(({ component }) => component)}
        </List>
      </>
    )
  }

  return (
    <>
      <Section>
        <Title order={3}>Recipes</Title>
        <SectionDescription>
          Select the recipes that you want to be considered in this factory.
        </SectionDescription>
        <TextInput
          placeholder='Search...'
          aria-label='search recipes'
          icon={<Search size={16} />}
          value={searchValue}
          onChange={(e) => { setSearchValue(e.currentTarget.value); }}
          style={{ marginBottom: '10px' }}
        />
        <Grid grow style={{ position: 'relative' }}>
          <Col span={6}>
            <Title order={3}>Alternate Recipes</Title>
            {renderRecipeOptions(true)}
          </Col>
          <Col span={6}>
            <Title order={3}>Base Recipes</Title>
            {renderRecipeOptions(false)}
          </Col>
          <VDivider />
        </Grid>
      </Section>
    </>
  );
};

export default RecipesTab;

const VDivider = styled.div`
  position: absolute;
  top: 20px;
  bottom: 20px;
  left: 255px;
  width: 1px;
  background: ${({ theme }) => theme.colors.background[3]};
`;
