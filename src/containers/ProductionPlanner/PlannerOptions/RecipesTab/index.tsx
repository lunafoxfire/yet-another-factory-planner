import React, { useState, useMemo, useCallback } from 'react';
import { Button, Input, Checkbox, Grid, Header, List } from 'semantic-ui-react';
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
  const [altRecipeSearch, setAltRecipeSearch] = useState('');
  const [baseRecipeSearch, setBaseRecipeSearch] = useState('');

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
    const [searchValue, setSearchValue] = alternates
      ? [altRecipeSearch, setAltRecipeSearch]
      : [baseRecipeSearch, setBaseRecipeSearch];
    const rendered = alternates ? renderedAltRecipes : renderedBaseRecipes
    return (
      <>
        <Input
          placeholder='Search...'
          fluid
          action
          value={searchValue}
          onChange={(e, { value }) => { setSearchValue(value); }}
        >
          <input />
          <Button onClick={() => { ctx.dispatch({ type: 'MASS_SET_RECIPES_ACTIVE', alternates, active: true }) }}>
            All
          </Button>
          <Button onClick={() => { ctx.dispatch({ type: 'MASS_SET_RECIPES_ACTIVE', alternates, active: false }) }}>
            None
          </Button>
        </Input>
        <List>
          {rendered.filter(({ label }) => label.toLowerCase().includes(searchValue)).map(({ component }) => component)}
        </List>
      </>
    )
  }

  return (
    <>
      <p>
        Select the recipes that are available to your factory
      </p>
      <Grid columns={2} divided={true}>
        <Grid.Row>
          <Grid.Column>
            <Header>Alternate Recipes</Header>
            {renderRecipeOptions(true)}
          </Grid.Column>
          <Grid.Column>
            <Header>Base Recipes</Header>
            {renderRecipeOptions(false)}
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </>
  );
};

export default RecipesTab;
