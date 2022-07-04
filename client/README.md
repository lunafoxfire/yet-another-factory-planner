# Info
This is a tool for designing production chains in [Satisfactory](https://www.satisfactorygame.com/). You can choose what and how many items you want to produce, and what items and recipes are available to you, and the calculator will calculate the entire production chain for those items. This particular tool was built with designing mega-bases with ridiculous production needs in mind, so the solver is fast regardless of the complexity of the production goals.

# Site
https://www.satisfactory-planner.net

# Features
* Choose production goals, available resources, and allowed recipes, and the solver will find the best production chain.
* Every factory is stored as a sharable link for easy saving and collaboration.
* All calculations are done in-browser... meaning no server communication to slow down site responsiveness. It's FAST!
* When choosing production goals you can choose either a target item/min rate, a target number of copies of a recipe, or you can maximize the production given the available resources.
* You can also choose AWESOME Sink Points as a production goal :D
* Recipes involving Nuclear Power Plants can be used, unlike other current production planners.
* All weights that the solver uses when determining the best production chain are made transparent and customizable by the user. Want to reduce how much you value Crude Oil and increase how much you value Copper Ore? Well now you can!
* Hand-gathered materials can optionally be included as inputs.
* Detailed Reporting section that calculates some interesting statistics including points produced, estimated power usage (or production), and minimum build area.
* Detailed breakdown of materials needed to construct the factory (which is SUPER helpful for huge factories). This includes a rough estimate on the minimal number of foundations required, and a list of all buildings required and their total build costs.

# Contributing
This site uses React and Typescript, and *requires* Node v16.x.x. To get the project running locally after cloning:
* Run `npm install`
* This project uses my [satisfactory-docs-parser](https://github.com/lydianlights/satisfactory-docs-parser) to collate item and recipe data. Place Satisfactory's `Docs.json` file at `<project_root>/data/Docs.json`. (See the repo link for more info on what `Docs.json` is and where to find it).
* Run `npm run parse-docs` -- the parsed files are output to `<project_root>/src/data/json`.
* Run `npm start`

PR's are always welcome!
