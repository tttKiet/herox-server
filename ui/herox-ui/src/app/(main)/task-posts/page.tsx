"use client";

import BoxCustom from "@/components/BoxCustom";
import TableTgPostManager from "@/components/Table/TableTgPostManager";

export default function TgPostsPage() {
  return (
    <div className="-mr-6">
      <BoxCustom>
        {/* title */}
        <div>
          <div className="flex items-center">
            <span className="w-[3px] h-5 bg-primary rounded-sm mr-2" />
            <h6 className="text-sm font-bold uppercase text-[#333335]">
              Tasks Manager
            </h6>
          </div>
          <p className="subtitle text-[#7987a1] fs-12 fw-normal ml-[11px]">
            View and manage Telegram user tasks and interactions
          </p>
        </div>

        {/* body */}
        <div className="mt-6">
          <TableTgPostManager />
        </div>
      </BoxCustom>
    </div>
  );
}
