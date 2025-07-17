"use client";

import { promptService } from "@/api/prompt";
import { getNimorKey } from "@/hook";
import { DeleteIcon, EditIcon } from "@/utils/icons";
import { TiPlus } from "react-icons/ti";

import { notificationFetch } from "@/utils";
import { IPrompt } from "@/utils/interfaces";
import type { IFilterPrompt } from "@/api/prompt";
import {
  Button,
  Chip,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
  Select,
  SelectItem,
} from "@heroui/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import FormAddPromptPost from "../Form/FormAddPromptPost";
import ModalCustom from "../Modal/Modal";
import ModalConfirm from "../Modal/ModalConfirm";

const columns = [
  { name: "Mention", uid: "mention" },
  { name: "Name", uid: "name" },
  { name: "Context", uid: "context" },
  { name: "Type", uid: "type" },
  { name: "Active", uid: "status" },
  { name: "Actions", uid: "actions" },
];

const PROMPT_OPTION = {
  PROMPT_POST: "post",
  PROMPT_CMT: "comment",
  PROMPT_IMG: "image",
};

type FormPrompt = {
  name: string;
  context: string;
  type: "PROMPT_POST" | "PROMPT_CMT" | "PROMPT_IMG";
  status: "production" | "test";
  description: string;
  _id?: string;
};

export default function TablePromptPost() {
  const [prompts, setPrompts] = useState<IPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  // Modal confirm delete
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<IPrompt | null>(null);
  // State lưu giá trị form
  const [formValues, setFormValues] = useState<FormPrompt>({
    context: "",
    type: "PROMPT_POST",
    status: "production",
    name: "",
    description: "",
  });

  // Ref để lưu hàm getValues từ form con
  const getDraftRef = useRef<(() => FormPrompt) | null>(null);

  // Filter state
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  // Khi mở modal, giữ nguyên formValues, khi submit thành công thì reset
  async function handleFormSubmit(data: {
    name: string;
    context: string;
    type: "PROMPT_POST" | "PROMPT_CMT" | "PROMPT_IMG";
    status: "production" | "test";
    description: string;
  }) {
    const apiKey = getNimorKey();
    if (!apiKey) return;
    await notificationFetch({
      promiseRunner: promptService.createOrUpdatePrompt({
        name: data.name,
        apiKey,
        context: data.context,
        type: data.type,
        status: data.status,
        description: data.description,
        _id: formValues._id, // truyền _id nếu có (edit)
      }),
    });
    await fetchPrompts();
    setFormValues({
      context: "",
      type: "PROMPT_POST",
      status: "production",
      description: "",
      name: "",
    }); // reset form
    onClose();
  }

  // Khi đóng modal (Cancel hoặc click ra ngoài), chỉ clear _id nếu đang ở trạng thái edit, còn add thì lưu nháp từ con truyền lên
  const handleCancel = useCallback(
    (draft?: FormPrompt) => {
      if (formValues?._id) {
        setFormValues({
          context: "",
          type: "PROMPT_POST",
          status: "production",
          description: "",
          name: "",
        });
      } else if (draft) {
        setFormValues(draft);
      }
      onClose();
    },
    [formValues, onClose]
  );

  // Hàm gọi khi modal bị đóng bằng backdrop hoặc nút X
  const handleModalClose = () => {
    if (formValues?._id) {
      setFormValues({
        context: "",
        type: "PROMPT_POST",
        status: "production",
        name: "",
        description: "",
      });
      onClose();
    } else if (getDraftRef.current) {
      setFormValues(getDraftRef.current());
      onClose();
    } else {
      onClose();
    }
  };

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const apiKey = getNimorKey();
      if (!apiKey) return;
      const filter: Partial<IFilterPrompt> = {};
      if (filterType) filter.type = filterType;
      if (filterStatus) filter.status = filterStatus;
      const res = await promptService.getPrompt({
        apiKey,
        filter: Object.keys(filter).length ? filter : undefined,
      });
      if (res && res.ok && Array.isArray(res.data)) {
        setPrompts(res.data);
      }
    } catch (err) {
      console.error("Error fetching prompts:", err);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // Edit: set formValues theo prompt, mở modal
  const handleEditPrompt = (id: string) => {
    const prompt = prompts.find((p) => p._id === id);
    if (prompt) {
      setFormValues({
        context: prompt.context,
        type: prompt.type as FormPrompt["type"],
        status: prompt.status as FormPrompt["status"],
        description: prompt.description || "",
        name: prompt.name,
        _id: prompt._id,
      }); // _id sẽ được truyền vào API update
      onOpen();
    }
  };

  // Delete: mở modal confirm xoá prompt
  const handleDeletePrompt = (id: string) => {
    const prompt = prompts.find((p) => p._id === id);
    if (prompt) {
      setPromptToDelete(prompt);
      setIsConfirmOpen(true);
    }
  };

  // Xác nhận xoá prompt
  const handleConfirmDelete = async () => {
    if (!promptToDelete) return;
    const apiKey = getNimorKey();
    if (!apiKey) return;
    await notificationFetch({
      promiseRunner: promptService.deletePrompt({
        apiKey,
        _id: promptToDelete._id,
      }),
    });
    await fetchPrompts();
    setIsConfirmOpen(false);
    setPromptToDelete(null);
  };

  // Huỷ xoá
  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setPromptToDelete(null);
  };

  // Khi nhấn Add Prompt, reset formValues về mặc định rồi mở modal
  const handleAddPrompt = () => {
    onOpen();
  };

  const renderCell = (item: IPrompt, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return (
          <div className="line-clamp-3 max-w-xs text-xs">{item?.name}</div>
        );
      case "context":
        return (
          <div className="line-clamp-3 max-w-xs text-xs">{item.context}</div>
        );

      case "mention":
        return (
          <div className="line-clamp-3 max-w-xs text-xs font-medium">
            {item.member?.fullName}
          </div>
        );
      case "type":
        const type = item.type;
        let color = undefined as
          | "primary"
          | "default"
          | "secondary"
          | "success"
          | "warning"
          | "danger"
          | undefined;
        if (type == "PROMPT_POST") {
          color = "primary";
        } else if (type == "PROMPT_CMT") {
          color = "secondary";
        } else if (type == "PROMPT_IMG") {
          color = "warning";
        }

        return (
          <Chip color={color} variant="flat" size="sm" className="font-bold">
            {PROMPT_OPTION[type as keyof typeof PROMPT_OPTION] || type}
          </Chip>
        );
      case "status":
        const isProduction = item.status == "production";
        return (
          <Switch
            isSelected={isProduction}
            onChange={async () => {
              const apiKey = getNimorKey();
              if (!apiKey) return;
              await notificationFetch({
                promiseRunner: promptService.createOrUpdatePrompt({
                  ...item,
                  apiKey,
                  status: isProduction ? "test" : "production",
                }),
              });
              await fetchPrompts();
            }}
            color="primary"
            size="sm"
          ></Switch>
        );

      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="default"
              onPress={() => handleEditPrompt(item._id)}
            >
              <EditIcon className="text-[16px]" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onPress={() => handleDeletePrompt(item._id)}
            >
              <DeleteIcon className="text-[16px]" />
            </Button>
          </div>
        );
      default:
        return item[columnKey as keyof IPrompt] as React.ReactNode;
    }
  };

  return (
    <div className="mt-4">
      {/* Modal confirm delete */}
      <ModalConfirm
        isOpen={isConfirmOpen}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        description={
          <>
            Are you sure you want to delete this prompt?
            <div className="mt-2 text-default-500 text-sm">
              <span className="font-bold">{promptToDelete?.context}</span>
            </div>
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="danger"
      />
      {/* Modal add/edit */}
      <ModalCustom
        isOpen={isOpen}
        onClose={handleModalClose}
        title="Add New Prompt"
        size="2xl"
      >
        <FormAddPromptPost
          isOpen={isOpen}
          onCancel={handleCancel}
          onSubmit={handleFormSubmit}
          defaultValues={formValues}
          onRegisterGetValues={(getValues) => {
            getDraftRef.current = getValues;
          }}
        />
      </ModalCustom>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-3 items-center">
          <Select
            label="Type"
            color="default"
            labelPlacement="outside"
            className="min-w-44 no-mt-select"
            selectedKeys={filterType ? [filterType] : []}
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as string;
              setFilterType(val || "");
            }}
          >
            <SelectItem key="">All Types</SelectItem>
            <SelectItem key="PROMPT_POST">Prompt Post</SelectItem>
            <SelectItem key="PROMPT_CMT">Prompt Comment</SelectItem>
            <SelectItem key="PROMPT_IMG">Prompt Image</SelectItem>
          </Select>
          <Select
            label="Active Status"
            color="default"
            labelPlacement="outside"
            className="min-w-44 no-mt-select"
            selectedKeys={filterStatus ? [filterStatus] : []}
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as string;
              setFilterStatus(val || "");
            }}
          >
            <SelectItem key="">All Status</SelectItem>
            <SelectItem key="production">Production</SelectItem>
            <SelectItem key="test">Test</SelectItem>
          </Select>
        </div>
        <Button
          color="primary"
          className="mt-5"
          onPress={handleAddPrompt}
          startContent={<TiPlus />}
        >
          Add Prompt
        </Button>
      </div>
      <Table aria-label="Prompt table" isHeaderSticky isStriped removeWrapper>
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.uid} align="start">
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={prompts}
          isLoading={loading}
          emptyContent={"No prompts found"}
        >
          {(item) => (
            <TableRow key={item._id}>
              {(columnKey) => (
                <TableCell>{renderCell(item, String(columnKey))}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
