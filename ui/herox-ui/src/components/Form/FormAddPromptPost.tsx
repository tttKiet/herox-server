import {
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
  Textarea,
} from "@heroui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";

const schema = yup.object({
  name: yup.string().required("Name is required"),
  context: yup.string().required("Context is required"),
  type: yup
    .string()
    .oneOf(["PROMPT_POST", "PROMPT_CMT", "PROMPT_IMG"])
    .required("Type is required"),
  status: yup
    .string()
    .oneOf(["production", "test"])
    .required("Status is required"),
  description: yup.string().default(""),
});

type FormValues = yup.InferType<typeof schema> & { _id?: string };

const TYPE_OPTIONS = [
  { value: "PROMPT_POST", label: "Prompt Post" },
  { value: "PROMPT_CMT", label: "Prompt Comment" },
  { value: "PROMPT_IMG", label: "Prompt Image" },
];

interface FormAddPromptPostProps {
  onSubmit: (data: FormValues) => Promise<void>;
  onCancel: (draft?: FormValues) => void;
  defaultValues: FormValues;
  isOpen: boolean;
  onRegisterGetValues?: (getValues: () => FormValues) => void;
  onStatusChange?: (status: "production" | "test") => void;
}

const FormAddPromptPost: React.FC<FormAddPromptPostProps> = ({
  onSubmit,
  onCancel,
  defaultValues,
  isOpen,
  onRegisterGetValues,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    getValues,
    control,
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues,
  });

  // Đăng ký getValues lên cha khi mount
  React.useEffect(() => {
    if (onRegisterGetValues) {
      onRegisterGetValues(getValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterGetValues]);

  // Reset form mỗi khi modal vừa mở (isOpen chuyển từ false -> true)
  React.useEffect(() => {
    if (isOpen) {
      reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleFormSubmit = async (data: FormValues) => {
    console.log("Submitting form with data: ", data);

    await onSubmit(data);
  };

  const handleCancelClick = () => {
    const draft = getValues();
    onCancel(draft);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex flex-col gap-4"
    >
      <Input
        type="text"
        label="Prompt Name"
        {...register("name")}
        isInvalid={!!errors.type}
        errorMessage={errors.type?.message}
        placeholder="Prompt name..."
        isRequired
      />
      <div className="flex items-center gap-4">
        {/* thêm name */}
        <Select
          label="Type"
          {...register("type")}
          isInvalid={!!errors.type}
          errorMessage={errors.type?.message}
          defaultSelectedKeys={["PROMPT_POST"]}
          isRequired
        >
          {TYPE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value}>{opt.label}</SelectItem>
          ))}
        </Select>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Switch
              isSelected={field.value === "production"}
              onChange={(e) =>
                field.onChange(e.target.checked ? "production" : "test")
              }
              aria-label="Active"
              color="primary"
              size="sm"
            >
              Active
            </Switch>
          )}
        />
      </div>
      <Textarea
        label="Context"
        {...register("context")}
        isInvalid={!!errors.context}
        errorMessage={errors.context?.message}
        minRows={12}
        maxRows={16}
        placeholder="Enter prompt context..."
        isRequired
      />
      <Textarea
        label="Description"
        {...register("description")}
        minRows={2}
        maxRows={5}
        placeholder="Optional description..."
      />
      <div className="flex gap-3 justify-end mt-2 mb-4">
        <Button
          type="button"
          variant="light"
          onPress={handleCancelClick}
          color="danger"
        >
          Cancel
        </Button>
        <Button type="submit" color="primary" isLoading={isSubmitting}>
          {defaultValues._id ? "Update" : "Add"}
        </Button>
      </div>
    </form>
  );
};

export default FormAddPromptPost;
