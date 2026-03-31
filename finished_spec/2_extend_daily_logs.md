# extend daily_log

- current the daily log table on the db just stores stats
- i want it also to store the info from recipes the user eats from each Menu
- and the information from their exercise training
- i want a new table, daily_log_meal, this will store what the user eats from the userMenu table
  - i want it to store the info of the userRecipe that the person chooses to eat from their Menu
  - so it will need:
    - id, uuid
    - name: recipe name
    - index: which meal number this is from
    - calories, protein, carbs, fat. calculate the totals for these
    - recipeId, don't make it a fk, just as text.
- i want to store the training which will come from the userBlock table. dailyLogWorkout
  - name: workoutName
  - energyLevel: a, b, c, d
  - userWorkoutId: not fk, just text field
    - new table dailyLogWarmup, there can be many warmups
    - name: warmup name
    - sourceWarmupId: just text field
  - Then we need dailyLogExercise
    - duplicate all the infor from userExercise
      - dailyLogSet Table, so i want to log each rep of an exercise
        - setIndex: which set this is
        - reps: number of reps
        - weight: the weight
        - rpe: rpe for set
        - notes: any notes from the set

- after the tables are setup, make sure to pnpm db:generate new the migration and, pnpm db:migrate, apply it.

- then i want to be able to generate some test data for these on the dictator/generation route in the web app.
- and i want a new route in the admin page, with a link in the sidebar, so an admin can view a users logs.
