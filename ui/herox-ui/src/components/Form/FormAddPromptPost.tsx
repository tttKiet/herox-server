import { Button, Select, SelectItem, Textarea } from "@heroui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

const schema = yup.object({
  context: yup.string().required("Context is required"),
  type: yup
    .string()
    .oneOf(["PROMPT_POST", "PROMPT_COMMENT", "PROMPT_IMG"])
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
  { value: "PROMPT_COMMENT", label: "Prompt Comment" },
  { value: "PROMPT_IMG", label: "Prompt Image" },
];
const STATUS_OPTIONS = [
  { value: "production", label: "Production" },
  { value: "test", label: "Test" },
];

interface FormAddPromptPostProps {
  onSubmit: (data: FormValues) => Promise<void>;
  onCancel: (draft?: FormValues) => void;
  defaultValues: FormValues;
  isOpen: boolean;
  onRegisterGetValues?: (getValues: () => FormValues) => void;
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
      <div className="flex items-center gap-4">
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
        <Select
          label="Status"
          {...register("status")}
          isInvalid={!!errors.status}
          errorMessage={errors.status?.message}
          defaultSelectedKeys={["production"]}
          isRequired
        >
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value}>{opt.label}</SelectItem>
          ))}
        </Select>
      </div>
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
