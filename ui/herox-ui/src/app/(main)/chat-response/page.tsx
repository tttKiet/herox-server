"use client";

import React from "react";
import BoxCustom from "@/components/BoxCustom";
import TableChatManager from "@/components/Table/TableChatManager";

export default function ChatResponsePage() {
  return (
    <div className="-mr-6">
      <BoxCustom>
        {/* title */}
        <div>
          <div className="flex items-center">
            <span className="w-[3px] h-5 bg-primary rounded-sm mr-2" />
            <h6 className="text-sm font-bold uppercase text-[#333335]">
              Chat Response Manager
            </h6>
          </div>
          <p className="subtitle text-[#7987a1] fs-12 fw-normal ml-[11px]">
            View and monitor AI chat responses and user messages
          </p>
        </div>
        {/* body */}
        <div className="mt-6">
          <TableChatManager />
        </div>
      </BoxCustom>
    </div>
  );
}
