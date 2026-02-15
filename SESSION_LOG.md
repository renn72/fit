# 2026-02-15

- **Database & API:**
    -  Implemented `ingredient` and `exercise` tables with support for overriding base items.
    -  Created `recipe` and `recipeToIngredient` tables.
    -   Built `exercise` and `ingredient` routers with `getAllOrg`, `get`, `getAllBase`, and `create` procedures.
    -   Added input schemas and validation (including metatag checks for `itemUpdater` and `dictator`).
-   **Frontend:**
    -   Implemented advanced data tables for Exercises and Ingredients using Dice UI components.
    -   Fixed client-side pagination and sorting issues in the data tables.
    -   Integrated `orpc` with React Query for efficient data fetching.
