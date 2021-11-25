import React, { useState, useMemo, useCallback } from 'react';
import { List, Checkbox, TextInput, Button, Text, Title, Grid, Col } from '@mantine/core';
import { Search } from 'react-feather';
import { recipes } from '../../../../data';
import { useProductionContext } from '../../../../contexts/production';

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
  }, [ctx]);

  const renderedBaseRecipes = useMemo(() => renderRecipeList(baseRecipes), [renderRecipeList]);
  const renderedAltRecipes = useMemo(() => renderRecipeList(altRecipes), [renderRecipeList]);

  function renderRecipeOptions(alternates: boolean) {
    const rendered = alternates ? renderedAltRecipes : renderedBaseRecipes
    return (
      <>
        <Button onClick={() => { ctx.dispatch({ type: 'MASS_SET_RECIPES_ACTIVE', alternates, active: true }) }}>
          All
        </Button>
        <Button onClick={() => { ctx.dispatch({ type: 'MASS_SET_RECIPES_ACTIVE', alternates, active: false }) }}>
          None
        </Button>
        <List listStyleType='none' spacing={6}>
          {rendered.filter(({ label }) => label.toLowerCase().includes(searchValue)).map(({ component }) => component)}
        </List>
      </>
    )
  }

  return (
    <>
      <Text>
        Select the recipes that you want to be considered in this factory.
      </Text>
      <TextInput
        placeholder='Search...'
        aria-label='search recipes'
        icon={<Search />}
        value={searchValue}
        onChange={(e) => { setSearchValue(e.currentTarget.value); }}
      />
      <Grid grow>
        <Col span={6}>
          <Title order={3}>Alternate Recipes</Title>
          {renderRecipeOptions(true)}
        </Col>
        <Col span={6}>
          <Title order={3}>Base Recipes</Title>
          {renderRecipeOptions(false)}
        </Col>
      </Grid>
    </>
  );
};

export default RecipesTab;
