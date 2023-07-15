# Community

Very sorry I haven't been actively responding to issues and PRs. Life is hard! I've got a lot going on IRL. I hope to be making big improvements to this project in the coming month or so, though. It's not abandoned, just temporarily inactive!

# Info

This is a tool for designing production chains in [Satisfactory](https://www.satisfactorygame.com/). You can choose what and how many items you want to produce, and what items and recipes are available to you, and the calculator will calculate the entire production chain for those items. This particular tool was built with designing mega-bases with ridiculous production needs in mind, so the solver is fast regardless of the complexity of the production goals.

Powered by my [satisfactory-docs-parser](https://github.com/lydianlights/satisfactory-docs-parser).

# Site

https://www.satisfactory-planner.net

# Features

-   Choose production goals, available resources, and allowed recipes, and the solver will find the best production chain.
-   Every factory is stored as a sharable link for easy saving and collaboration.
-   All calculations are done in-browser... meaning no server communication to slow down site responsiveness. It's FAST!
-   When choosing production goals you can choose either a target item/min rate, a target number of copies of a recipe, or you can maximize the production given the available resources.
-   You can also choose AWESOME Sink Points as a production goal :D
-   Recipes involving Nuclear Power Plants can be used, unlike other current production planners.
-   All weights that the solver uses when determining the best production chain are made transparent and customizable by the user. Want to reduce how much you value Crude Oil and increase how much you value Copper Ore? Well now you can!
-   Hand-gathered materials can optionally be included as inputs.
-   Detailed Reporting section that calculates some interesting statistics including points produced, estimated power usage (or production), and minimum build area.
-   Detailed breakdown of materials needed to construct the factory (which is SUPER helpful for huge factories). This includes a rough estimate on the minimal number of foundations required, and a list of all buildings required and their total build costs.

# Contributing

This repo is currently in the middle of transferring hosting providers and making some related architectural changes. AKA, Heroku was becoming too expensive when superior options are available. Contributions should be put on pause until further notice as I plan to transition the app to a fully serverless architecture. In the end it should be both cheaper, easier to maintain, and maybe even faster for worldwide users.
