"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { zodValidator } from "@tanstack/zod-form-adapter"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { orpc } from "@/utils/orpc"
import { IngredientCreateInput } from "@fit/api/schemas/ingredient"

interface IngredientCreateFormProps {
  onSuccess?: () => void
}

export function IngredientCreateForm({ onSuccess }: IngredientCreateFormProps) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation(
    orpc.ingredient.create.mutationOptions({
      onSuccess: () => {
        toast.success("Ingredient created successfully")
        queryClient.invalidateQueries({
          queryKey: orpc.ingredient.getAllOrg.queryKey(),
        })
        onSuccess?.()
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create ingredient")
      },
    })
  )

  const form = useForm({
    defaultValues: {
      name: "",
      calories: 0,
      protein: 0,
      fat: 0,
      carbohydrate: 0,
      serveSize: 100,
      serveUnit: "g",
      baseIngredientId: null as string | null,
    },
    validatorAdapter: zodValidator(),
    validators: {
      onSubmit: IngredientCreateInput,
    },
    onSubmit: async ({ value }) => {
      mutate(value)
    },
  })

  return (
    <form
      id="ingredient-create-form"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      <FieldGroup>
        <form.Field
          name="name"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="e.g. Chicken Breast"
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <div className="grid grid-cols-2 gap-4">
          <form.Field
            name="calories"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Calories (kcal)</FieldLabel>
                  <Input
                    id={field.name}
                    type="number"
                    step="0.1"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <form.Field
            name="protein"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Protein (g)</FieldLabel>
                  <Input
                    id={field.name}
                    type="number"
                    step="0.1"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <form.Field
            name="fat"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Fat (g)</FieldLabel>
                  <Input
                    id={field.name}
                    type="number"
                    step="0.1"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <form.Field
            name="carbohydrate"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Carbs (g)</FieldLabel>
                  <Input
                    id={field.name}
                    type="number"
                    step="0.1"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <form.Field
            name="serveSize"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Serve Size</FieldLabel>
                  <Input
                    id={field.name}
                    type="number"
                    step="1"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <form.Field
            name="serveUnit"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Unit</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="e.g. g, ml, piece"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
        </div>
      </FieldGroup>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => form.reset()}
          disabled={isPending}
        >
          Reset
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Ingredient"}
        </Button>
      </div>
    </form>
  )
}
