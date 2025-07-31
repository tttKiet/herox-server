"use client";

import BoxCustom from "@/components/BoxCustom";
import TableTelegramUserManager from "@/components/Table/TableTelegramUserManager";

export default function TelegramUsersPage() {
  return (
    <div className="-mr-6">
      <BoxCustom>
        {/* title */}
        <div>
          <div className="flex items-center">
            <span className="w-[3px] h-5 bg-primary rounded-sm mr-2" />
            <h6 className="text-sm font-bold uppercase text-[#333335]">
              Telegram User Manager
            </h6>
          </div>
          <p className="subtitle text-[#7987a1] fs-12 fw-normal ml-[11px]">
            View and monitor Telegram bot users and interactions
          </p>
        </div>

        {/* body */}
        <div className="mt-6">
          <TableTelegramUserManager />
        </div>
      </BoxCustom>
    </div>
  );
}
